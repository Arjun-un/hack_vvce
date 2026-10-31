const { GoogleGenAI } = require('@google/genai');

const ACTIVE_GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite'
];

/**
 * Helper to call Gemini REST API with auto-fallback across active models
 */
async function callGeminiApi(prompt, systemInstruction = '', responseSchema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured');
  }

  for (const model of ACTIVE_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const bodyPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      };

      if (systemInstruction) {
        bodyPayload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn(`[Gemini API] ${model} returned status ${res.status}:`, errorData?.error?.message?.slice(0, 80));
        continue; // Try next active model
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.warn(`[Gemini API] Failed on model ${model}:`, err.message);
    }
  }

  throw new Error('All Gemini models unavailable or rate limited');
}

/**
 * Classifies patient inquiries and generates safe answers based on clinic context
 */
async function triagePatientMessage(message, clinicContext) {
  // Guardrail: Acute emergency check
  const lowerMsg = message.toLowerCase();
  const emergencyKeywords = ['heart attack', 'chest pain', 'unconscious', 'breathing difficulty', 'profuse bleeding', 'poison', 'stroke'];
  const isEmergency = emergencyKeywords.some(k => lowerMsg.includes(k));

  if (isEmergency) {
    return {
      intent: 'emergency_escalation',
      aiConfidence: 0.99,
      aiResponse: '⚠️ CRITICAL ALERT: If experiencing acute chest pain, severe breathing difficulty, or loss of consciousness, please dial 108 or proceed immediately to the nearest Hospital Casualty. Sanjeevani Clinic OPD cannot handle acute resuscitation.',
      requiresGraduate: false,
    };
  }

  // Attempt live Gemini triage
  try {
    const prompt = `You are the automated medical receptionist AI for "${clinicContext.name}".
Clinic Address: ${clinicContext.address || 'Mysuru'}
Operating Hours: ${clinicContext.operatingHours || '09:00 AM - 08:30 PM'}
Current Clinic Status: ${clinicContext.currentStatus || 'Open'}
Active Notice: ${clinicContext.emergencyNotice || 'None'}
Active Doctors: ${clinicContext.doctorsList || 'Dr. Ramesh Rao (Cardiologist, ₹500), Dr. Sneha Patil (Pediatrician, ₹400), Dr. Amit Joshi (General Medicine, ₹350)'}

Patient Inquiry: "${message}"

Instructions:
1. Classify the intent: "general_faq", "appointment_booking", "appointment_conflict", or "emergency_escalation".
2. Provide a warm, helpful, professional response in 1-2 sentences. Mention relevant doctor name, fees, or operating hours if applicable.
3. NEVER provide drug prescriptions or definitive clinical diagnoses.
4. Output strictly valid JSON.

JSON Schema:
{
  "intent": "general_faq",
  "aiConfidence": 0.95,
  "aiResponse": "Helpful answer here"
}`;

    const parsed = await callGeminiApi(prompt);
    if (parsed && parsed.aiResponse) {
      return {
        intent: parsed.intent || 'general_faq',
        aiConfidence: parsed.aiConfidence || 0.92,
        aiResponse: parsed.aiResponse,
        requiresGraduate: parsed.intent === 'appointment_conflict'
      };
    }
  } catch (err) {
    console.warn('Gemini live triage error, using local expert rules:', err.message);
  }

  // Fallback intelligent rule engine
  if (lowerMsg.includes('fee') || lowerMsg.includes('cost') || lowerMsg.includes('charge') || lowerMsg.includes('price')) {
    return {
      intent: 'general_faq',
      aiConfidence: 0.96,
      aiResponse: `General physician consultation fee at ${clinicContext.name} is ₹350 - ₹400, and cardiology/pediatrics specialist is ₹500. No advance payment required for online QR booking.`,
      requiresGraduate: false,
    };
  }

  if (lowerMsg.includes('timing') || lowerMsg.includes('open') || lowerMsg.includes('time') || lowerMsg.includes('available') || lowerMsg.includes('hours')) {
    return {
      intent: 'general_faq',
      aiConfidence: 0.97,
      aiResponse: `${clinicContext.name} OPD operates from ${clinicContext.operatingHours || '09:00 AM to 08:30 PM'}. Today's active status is ${String(clinicContext.currentStatus || 'Open').toUpperCase()}.`,
      requiresGraduate: false,
    };
  }

  if (lowerMsg.includes('doctor') || lowerMsg.includes('sneha') || lowerMsg.includes('ramesh') || lowerMsg.includes('pediatric') || lowerMsg.includes('heart')) {
    return {
      intent: 'general_faq',
      aiConfidence: 0.94,
      aiResponse: `Available doctors today: ${clinicContext.doctorsList || 'Dr. Ramesh Rao (Cardiologist) & Dr. Sneha Patil (Pediatrician)'}. You can book an OP token directly from the booking tab.`,
      requiresGraduate: false,
    };
  }

  return {
    intent: 'general_faq',
    aiConfidence: 0.90,
    aiResponse: `Thank you for contacting ${clinicContext.name}. For immediate appointments, select your preferred doctor and slot above, or ask our front desk receptionist upon arrival.`,
    requiresGraduate: false,
  };
}

/**
 * Recommends the most suitable doctor and slot based on patient symptoms and demographics
 */
async function recommendDoctorForSymptoms({ symptoms, age, gender, clinicContext, doctors = [] }) {
  const doctorsContext = doctors.map(d => ({
    id: d._id || d.id,
    name: d.name,
    speciality: d.speciality,
    fee: d.fee,
    isOnDuty: d.isOnDuty,
    room: d.room
  }));

  try {
    const prompt = `You are a medical triage AI assistant for "${clinicContext.name || 'Sanjeevani Clinic'}".
Patient Age: ${age || 'Not specified'}
Patient Gender: ${gender || 'Not specified'}
Reported Symptoms / Chief Complaint: "${symptoms}"

Available Doctors:
${JSON.stringify(doctorsContext, null, 2)}

Task:
1. Identify the most clinically appropriate doctor from the list for these symptoms (consider age for Pediatrics, cardiac symptoms for Cardiology, general malaise for General Medicine, etc.).
2. If symptoms are potentially acute emergencies, flag isEmergency: true.
3. Provide a warm, 1-sentence explanation why this doctor is recommended.
4. Suggest whether Morning or Evening slot is ideal.

Format strictly as JSON:
{
  "recommendedDoctorId": "ID_OF_THE_BEST_DOCTOR",
  "recommendedDoctorName": "Doctor Name",
  "speciality": "Speciality",
  "reason": "1-sentence friendly explanation for the patient",
  "suggestedShift": "morning" | "evening",
  "isEmergency": false,
  "confidenceScore": 95
}`;

    const parsed = await callGeminiApi(prompt);
    if (parsed && (parsed.recommendedDoctorId || parsed.recommendedDoctorName)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini doctor recommendation fallback:', err.message);
  }

  // Local rule-based recommendation fallback
  const s = (symptoms || '').toLowerCase();
  const numAge = Number(age);

  let targetDoc = doctors.find(d => d.isOnDuty) || doctors[0];

  if ((numAge && numAge < 15) || s.includes('child') || s.includes('baby') || s.includes('kid')) {
    const pedia = doctors.find(d => d.speciality.toLowerCase().includes('pediatric'));
    if (pedia) targetDoc = pedia;
  } else if (s.includes('chest') || s.includes('heart') || s.includes('bp') || s.includes('palpitation') || s.includes('breath')) {
    const cardio = doctors.find(d => d.speciality.toLowerCase().includes('cardio'));
    if (cardio) targetDoc = cardio;
  } else if (s.includes('bone') || s.includes('joint') || s.includes('knee') || s.includes('back') || s.includes('fracture')) {
    const ortho = doctors.find(d => d.speciality.toLowerCase().includes('ortho'));
    if (ortho) targetDoc = ortho;
  }

  return {
    recommendedDoctorId: targetDoc?._id || targetDoc?.id || '',
    recommendedDoctorName: targetDoc?.name || 'Duty Doctor',
    speciality: targetDoc?.speciality || 'General Medicine',
    reason: `Based on your symptoms and age, ${targetDoc?.name || 'our doctor'} specializes in ${targetDoc?.speciality || 'general health'} and is best suited for your consultation.`,
    suggestedShift: 'morning',
    isEmergency: s.includes('severe chest') || s.includes('unconscious'),
    confidenceScore: 88
  };
}

module.exports = {
  triagePatientMessage,
  recommendDoctorForSymptoms,
  callGeminiApi
};
