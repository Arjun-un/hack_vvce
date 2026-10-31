const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Business = require('../models/Business');
const { JWT_SECRET, authenticateToken } = require('../middleware/authMiddleware');
const { ensureClinicExists } = require('../services/clinicPresetService');
const { sendRegistrationWelcomeEmail } = require('../services/emailService');

// Preset accounts map for seamless demo & testing
const PRESET_ACCOUNTS = {
  // Graduate Operator
  'aarav.sharma@opsloop.internal': {
    name: 'Aarav Sharma',
    role: 'graduate',
    phone: '+91 99887 66554'
  },
  'arjun.mehta@opsloop.internal': {
    name: 'Arjun Mehta',
    role: 'graduate',
    phone: '+91 99887 66554'
  },
  // Clinic Owner
  'dr.rajesh@sanjeevani.com': {
    name: 'Dr. Rajesh Sharma',
    role: 'business_owner',
    phone: '+91 98450 12345'
  },
  'dr.ramesh@sanjeevaniclinic.in': {
    name: 'Dr. Rajesh Sharma (Clinic Owner)',
    role: 'business_owner',
    phone: '+91 98450 12345'
  },
  'owner@sanjeevani.com': {
    name: 'Dr. Rajesh Sharma',
    role: 'business_owner',
    phone: '+91 98450 12345'
  },
  // Doctor Specialist
  'dr.sneha@sanjeevani.com': {
    name: 'Dr. Sneha Kulkarni',
    role: 'doctor',
    phone: '+91 98450 67890'
  },
  'dr.ramesh@greenlife.com': {
    name: 'Dr. Ramesh Kumar',
    role: 'doctor',
    phone: '+91 98450 12345'
  },
  'dr.anita@opsloop.com': {
    name: 'Dr. Anita Desai',
    role: 'doctor',
    phone: '+91 98450 33445'
  },
  // Admin
  'admin@opsloop.com': {
    name: 'Central OpsLoop Administrator',
    role: 'admin',
    phone: '+91 98000 11111'
  }
};

/**
 * POST /api/auth/login
 * Authenticates user credentials & returns signed JWT with assigned role
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const roleHint = req.body.roleHint || req.body.requiredRole;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Auto-provision known presets if not yet created in MongoDB
    if (!user) {
      const preset = PRESET_ACCOUNTS[cleanEmail];
      if (preset) {
        user = await User.create({
          name: preset.name,
          email: cleanEmail,
          password: password || 'password123',
          phone: preset.phone,
          role: preset.role
        });
      } else {
        // If roleHint is provided (operator, owner, or doctor), create on-the-fly for quick demo
        const assignedRole = roleHint === 'owner' ? 'business_owner' : (roleHint === 'doctor' ? 'doctor' : (roleHint === 'admin' ? 'admin' : 'graduate'));
        const defaultName = assignedRole === 'business_owner' ? 'Clinic Director' : (assignedRole === 'doctor' ? 'Doctor Specialist' : 'Automation Specialist');
        
        user = await User.create({
          name: defaultName,
          email: cleanEmail,
          password: password || 'password123',
          phone: '+91 98765 43210',
          role: assignedRole
        });
      }
    }

    // Role-specific authorization check if caller specified required workspace
    if (roleHint) {
      const targetRole = roleHint === 'owner' ? 'business_owner' : (roleHint === 'operator' ? 'graduate' : (roleHint === 'doctor' ? 'doctor' : roleHint));
      if (targetRole !== user.role && user.role !== 'admin') {
        const workspaceName = roleHint === 'owner' ? 'Clinic Owner Cockpit' : (roleHint === 'doctor' ? 'Doctor Dashboard' : 'Graduate Workspace');
        return res.status(403).json({
          success: false,
          error: `Authorization Error: This account has role '${user.role}' and cannot enter the ${workspaceName}.`,
          userRole: user.role,
          requiredRole: targetRole
        });
      }
    }

    // Issue JWT token with embedded role claims
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user context
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/demo-accounts
 * Helper endpoint for landing page demo switches
 */
router.get('/demo-accounts', (req, res) => {
  res.json({
    operator: {
      email: 'aarav.sharma@opsloop.internal',
      role: 'graduate',
      name: 'Aarav Sharma',
      title: 'Certified Graduate Operator'
    },
    owner: {
      email: 'dr.rajesh@sanjeevani.com',
      role: 'business_owner',
      name: 'Dr. Rajesh Sharma',
      title: 'Clinic Owner & Director'
    },
    doctor: {
      email: 'dr.sneha@sanjeevani.com',
      role: 'doctor',
      name: 'Dr. Sneha Kulkarni',
      title: 'Pediatrician & Consultant Doctor'
    }
  });
});

/**
 * POST /api/auth/register
 * Universal registration endpoint for all roles (Doctor, Clinic Owner, Graduate Operator)
 * Sends welcome registration email via Nodemailer
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role = 'graduate', 
      phone, 
      speciality, 
      qualification, 
      clinicSlug = 'sanjeevani-clinic' 
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Full name and email address are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email address already exists. Please sign in instead.' 
      });
    }

    // Normalize role string
    let targetRole = role;
    if (role === 'owner') targetRole = 'business_owner';
    if (role === 'operator') targetRole = 'graduate';

    const validRoles = ['graduate', 'business_owner', 'doctor', 'admin'];
    if (!validRoles.includes(targetRole)) {
      targetRole = 'graduate';
    }

    // Create User record
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password || 'password123',
      role: targetRole,
      phone: phone || '+91 98765 43210',
      status: 'active'
    });

    // If registered as Doctor, auto-provision or link Doctor model record
    if (targetRole === 'doctor') {
      const clinic = await ensureClinicExists(clinicSlug);
      const doctorRecord = await Doctor.create({
        businessId: clinic._id,
        name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
        email: cleanEmail,
        qualification: qualification || 'MBBS, MD',
        speciality: speciality || 'General Medicine / Specialist',
        phone: phone || '+91 98450 12345',
        room: 'Cabin 2',
        shift: 'Morning & Evening',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '04:30 PM', '05:30 PM', '06:30 PM'],
        isOnDuty: true,
        maxSlotsToday: 20
      });

      user.doctorId = doctorRecord._id;
      await user.save();
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email asynchronously
    sendRegistrationWelcomeEmail({
      user,
      roleName: targetRole,
      portalUrl: targetRole === 'doctor' ? '/doctor' : (targetRole === 'business_owner' ? '/clinic' : '/operator')
    }).catch(err => console.error('Error sending registration welcome email:', err.message));

    res.status(201).json({
      success: true,
      message: `Registration successful! Welcome email dispatched to ${user.email}.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

