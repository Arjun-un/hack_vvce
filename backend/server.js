const express = require('express');
const cors = require('cors');
const path = require('path');
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

// API Routes
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/clinic', require('./routes/clinicRoutes'));
app.use('/api/graduate', require('./routes/graduateRoutes'));
app.use('/api/operator', operatorRoutes);

// Health check & Sample Route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to OpsLoop MERN Backend API' });
});

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

// Serve Frontend Static Distribution (Production Build)
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// SPA Client-side Routing Fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Function to establish Ngrok tunnel automatically
async function startNgrokTunnel(port) {
  const token = process.env.NGROK_AUTHTOKEN;
  if (!token) {
    console.log('ℹ️  No NGROK_AUTHTOKEN found in .env; running on localhost only.');
    return;
  }

  try {
    const ngrok = require('@ngrok/ngrok');
    const listener = await ngrok.forward({
      addr: port,
      authtoken: token,
    });
    const publicUrl = listener.url();
    app.locals.publicUrl = publicUrl;

    console.log('\n================================================================');
    console.log('🚀 NGROK PUBLIC TUNNEL IS LIVE & SCANNABLE WORLDWIDE!');
    console.log(`📱 Public QR Patient Portal:  ${publicUrl}/qr/sanjeevani-clinic`);
    console.log(`💻 Public Clinic Dashboard:   ${publicUrl}/`);
    console.log(`🔌 Public API Endpoint:       ${publicUrl}/api/health`);
    console.log('================================================================\n');
  } catch (err) {
    console.warn('⚠️  Could not start Ngrok tunnel automatically:', err.message);
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log(`Local server running on http://localhost:${PORT}`);
  await startNgrokTunnel(PORT);
});
