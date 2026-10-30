const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

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

// Sample Route & Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to OpsLoop MERN Backend API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
