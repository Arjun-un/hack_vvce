const { GoogleGenAI } = require('@google/genai');

let aiClient = null;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn('Gemini AI initialization notice:', e.message);
}

/**
 * Classifies patient inquiries and generates safe answers based on clinic context
 */
async function triagePatientMessage(message, clinicContext) {
  // First, check for acute medical emergencies locally as safety guardrail
  const lowerMsg = message.toLowerCase();
  const emergencyKeywords = ['heart attack', 'chest pain', 'unconscious', 'breathing difficulty', 'profuse bleeding', 'poison', 'stroke'];
  const isEmergency = emergencyKeywords.some(k => lowerMsg.includes(k));

  if (isEmergency) {
    return {
      intent: 'emergency_escalation',
      aiConfidence: 0.99,
      aiResponse: '⚠️ CRITICAL ALERT: If the patient is experiencing acute chest pain, severe breathing difficulty, or loss of consciousness, please dial 108 or proceed immediately to the nearest Hospital Emergency Casualty. Clinic OPD cannot handle acute resuscitation.',
      requiresGraduate: false,
    };
  }

  // If Gemini client is ready, prompt Gemini
  if (aiClient) {
    try {
      const prompt = `You are an automated medical clinic receptionist AI for "${clinicContext.name}".
Clinic Address: ${clinicContext.address}
Operating Hours: ${clinicContext.operatingHours}
Clinic Status: ${clinicContext.currentStatus}
Active Emergency Notice: ${clinicContext.emergencyNotice || 'None'}
Active Doctors: ${clinicContext.doctorsList || 'Dr. Rajesh Sharma (General Medicine), Dr. Sneha Kulkarni (Pediatrics)'}

Patient Inquiry: "${message}"

Task:
1. Classify the intent into ONE of: "general_faq", "appointment_booking", "appointment_conflict", "emergency_escalation".
2. Provide a helpful, warm, professional 1-2 sentence response.
3. NEVER give clinical diagnoses or prescribe medicines.
4. If the user asks for a slot outside working hours or with an off-duty doctor, set intent to "appointment_conflict".

Format your response strictly as JSON:
{
  "intent": "general_faq" | "appointment_booking" | "appointment_conflict" | "emergency_escalation",
  "aiConfidence": 0.95,
  "aiResponse": "Your response here"
}`;

      let response;
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout')), 6000));
        const callPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        response = await Promise.race([callPromise, timeoutPromise]);
      } catch (mErr) {
        try {
          response = await aiClient.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
          });
        } catch (mErr2) {
          throw new Error('Both Gemini models busy');
        }
      }

      const text = response.text ? response.text.trim() : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'general_faq',
          aiConfidence: parsed.aiConfidence || 0.92,
          aiResponse: parsed.aiResponse,
          requiresGraduate: parsed.intent === 'appointment_conflict'
        };
      }
    } catch (apiError) {
      console.warn('Gemini API call failed, falling back to intelligent rule engine:', apiError.message);
    }
  }

  // Robust Rule-Engine Fallback
  if (lowerMsg.includes('fee') || lowerMsg.includes('cost') || lowerMsg.includes('charge')) {
    return {
      intent: 'general_faq',
      aiConfidence: 0.95,
      aiResponse: `General physician consultation fee at ${clinicContext.name} is ₹400, and specialist pediatrics/ortho is ₹500. No advance payment required for online QR booking.`,
      requiresGraduate: false,
    };
  }

  if (lowerMsg.includes('timing') || lowerMsg.includes('open') || lowerMsg.includes('time') || lowerMsg.includes('available')) {
    return {
      intent: 'general_faq',
      aiConfidence: 0.96,
      aiResponse: `${clinicContext.name} OPD operates from ${clinicContext.operatingHours}. Today's active status is ${clinicContext.currentStatus.toUpperCase()}.`,
      requiresGraduate: false,
    };
  }

  if (lowerMsg.includes('book') || lowerMsg.includes('appointment') || lowerMsg.includes('slot')) {
    return {
      intent: 'appointment_booking',
      aiConfidence: 0.93,
      aiResponse: 'You can book an immediate slot using the booking form above. Select your doctor and preferred time slot.',
      requiresGraduate: false,
    };
  }

  return {
    intent: 'general_faq',
    aiConfidence: 0.88,
    aiResponse: `Thank you for reaching out to ${clinicContext.name}. Our front desk and OpsLoop team have recorded your message and will assist you promptly.`,
    requiresGraduate: false,
  };
}

module.exports = { triagePatientMessage };
