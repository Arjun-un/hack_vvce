const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const operatorRoutes = require('./routes/operatorRoutes');
const { GoogleGenAI } = require('@google/genai');

// Connect to MongoDB Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/operator', operatorRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpsLoop Backend API',
    automationEngine: 'Online (Node.js Native)',
    timestamp: new Date().toISOString()
  });
});

// Gemini AI live triage endpoint
app.post('/api/gemini/triage', async (req, res) => {
  try {
    const { message, clinicName } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      You are the OpsLoop AI triage assistant for "${clinicName || 'Local Clinic'}".
      Analyze this customer request and return a JSON object with keys:
      - intent: (e.g. "BOOKING_REQUEST", "GENERAL_ENQUIRY", "EMERGENCY_ESCALATION", "CANCELLATION")
      - confidenceScore: (number between 0 and 100)
      - needsHumanReview: (boolean, true if ambiguous, urgent, or confidence < 80)
      - extractedDetails: { patientName, requestedDate, requestedTime, doctorSpeciality, urgency }
      - suggestedActions: array of 3 short action strings for the graduate operator
      - summary: 1-sentence operator summary

      Customer Message: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Gemini triage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
