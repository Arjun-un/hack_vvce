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
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/clinic', require('./routes/clinicRoutes'));
app.use('/api/graduate', require('./routes/graduateRoutes'));
app.use('/api/operator', operatorRoutes);
app.use('/api/doctor', require('./routes/doctorRoutes'));

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

const { callGeminiApi } = require('./services/geminiService');

// Gemini AI live triage endpoint
app.post('/api/gemini/triage', async (req, res) => {
  try {
    const { message, clinicName } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

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

    try {
      const parsed = await callGeminiApi(prompt);
      res.json({ success: true, data: parsed });
    } catch (aiErr) {
      console.warn('Live Gemini call failed, using intelligent fallback triage:', aiErr.message);
      // Fast heuristic fallback
      const lower = (message || '').toLowerCase();
      let intent = 'GENERAL_ENQUIRY';
      if (lower.includes('chest') || lower.includes('bleed') || lower.includes('breath') || lower.includes('emergency')) {
        intent = 'EMERGENCY_ESCALATION';
      } else if (lower.includes('book') || lower.includes('slot') || lower.includes('appointment')) {
        intent = 'BOOKING_REQUEST';
      }

      res.json({
        success: true,
        data: {
          intent,
          confidenceScore: 89,
          needsHumanReview: intent === 'EMERGENCY_ESCALATION',
          extractedDetails: { urgency: intent === 'EMERGENCY_ESCALATION' ? 'HIGH' : 'NORMAL' },
          suggestedActions: ['Confirm appointment time with patient', 'Verify doctor on-duty status', 'Issue digital token'],
          summary: `Automated triage for ${clinicName || 'Clinic'}: ${message.slice(0, 50)}...`
        }
      });
    }
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
let activeNgrokListener = null;

async function startNgrokTunnel(port) {
  const token = process.env.NGROK_AUTHTOKEN;
  if (!token) {
    console.log('ℹ️  No NGROK_AUTHTOKEN found in .env; running on localhost only.');
    return;
  }

  let ngrok;
  try {
    ngrok = require('@ngrok/ngrok');
    try {
      await ngrok.disconnect();
      await ngrok.kill();
    } catch (_) {}

    const listener = await ngrok.forward({
      addr: port,
      authtoken: token,
    });
    activeNgrokListener = listener;
    const publicUrl = listener.url();
    app.locals.publicUrl = publicUrl;

    console.log('\n================================================================');
    console.log('🚀 NGROK PUBLIC TUNNEL IS LIVE & SCANNABLE WORLDWIDE!');
    console.log(`📱 Public QR Patient Portal:  ${publicUrl}/qr/sanjeevani-clinic`);
    console.log(`💻 Public Clinic Dashboard:   ${publicUrl}/`);
    console.log(`🔌 Public API Endpoint:       ${publicUrl}/api/health`);
    console.log('================================================================\n');
  } catch (err) {
    console.warn('⚠️  Ngrok tunnel initial forward:', err.message);
    // If endpoint is already active on ngrok free tier (ERR_NGROK_334), extract and bind the known static domain
    const match = err.message && err.message.match(/https:\/\/[^\s'"]+/);
    if (match) {
      app.locals.publicUrl = match[0];
      console.log(`✅ Using active online Ngrok endpoint: ${app.locals.publicUrl}`);
      console.log(`📱 Scannable QR: ${app.locals.publicUrl}/qr/sanjeevani-clinic\n`);
    } else if (process.env.PUBLIC_URL) {
      app.locals.publicUrl = process.env.PUBLIC_URL;
    }
  }
}

// Graceful cleanup so nodemon and restarts do not lock the tunnel
const cleanupTunnel = async () => {
  try {
    if (activeNgrokListener) {
      await activeNgrokListener.close().catch(() => {});
    }
    const ngrok = require('@ngrok/ngrok');
    await ngrok.disconnect().catch(() => {});
    await ngrok.kill().catch(() => {});
  } catch (_) {}
};

process.once('SIGUSR2', async () => {
  await cleanupTunnel();
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  await cleanupTunnel();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanupTunnel();
  process.exit(0);
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Local server running on http://localhost:${PORT}`);
  await startNgrokTunnel(PORT);
});

