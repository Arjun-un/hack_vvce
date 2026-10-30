const express = require('express');
const router = express.Router();

const Business = require('../models/Business');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const { processBookingRequest } = require('../services/bookingService');
const { triagePatientMessage } = require('../services/geminiService');

/**
 * GET /api/customer/clinic/:slug
 * Public landing info for QR scan
 */
router.get('/clinic/:slug', async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug })
      .populate('assignedGraduateId', 'name phone email');

    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const doctors = await Doctor.find({ businessId: business._id });

    res.json({
      business,
      doctors,
      assignedGraduate: business.assignedGraduateId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer/book
 * Customer slot booking through QR scan
 */
router.post('/book', async (req, res) => {
  try {
    const {
      businessSlug,
      doctorId,
      patientName,
      patientPhone,
      age,
      gender,
      bloodGroup,
      timeSlot,
      date,
      symptoms
    } = req.body;

    if (!businessSlug || !doctorId || !patientName || !patientPhone) {
      return res.status(400).json({ error: 'Missing required booking fields (doctor, name, phone).' });
    }

    const result = await processBookingRequest({
      businessSlug,
      doctorId,
      patientName,
      patientPhone,
      age,
      gender,
      bloodGroup,
      timeSlot,
      date,
      symptoms,
      bookingSource: 'qr_ai'
    });

    if (result.isConflict) {
      return res.status(202).json({
        success: true,
        status: 'pending_review',
        message: 'Your slot request is being coordinated by our dedicated OpsLoop specialist (Graduate).',
        appointment: result.appointment,
        conflictReason: result.conflictReason
      });
    }

    return res.status(201).json({
      success: true,
      status: 'confirmed',
      message: 'Your appointment is confirmed and added to the clinic queue.',
      appointment: result.appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer/enquiry
 * Customer inquiry handled via Gemini AI
 */
router.post('/enquiry', async (req, res) => {
  try {
    const { businessSlug, customerName, customerPhone, message } = req.body;

    if (!businessSlug || !message) {
      return res.status(400).json({ error: 'Business slug and message are required.' });
    }

    const business = await Business.findOne({ slug: businessSlug });
    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const doctors = await Doctor.find({ businessId: business._id, isOnDuty: true });
    const doctorsList = doctors.map(d => `${d.name} (${d.speciality}, ${d.room})`).join(', ');

    const clinicContext = {
      name: business.name,
      address: business.address,
      operatingHours: business.operatingHours,
      currentStatus: business.currentStatus,
      emergencyNotice: business.hasActiveEmergencyNotice ? business.emergencyNotice : '',
      doctorsList
    };

    // Process through Gemini AI
    const triage = await triagePatientMessage(message, clinicContext);

    // Save to MongoDB
    const enquiry = new Enquiry({
      businessId: business._id,
      customerName: customerName || 'Guest Patient',
      customerPhone: customerPhone || '',
      rawMessage: message,
      intent: triage.intent,
      aiResponse: triage.aiResponse,
      aiConfidence: triage.aiConfidence,
      status: triage.requiresGraduate ? 'assigned_to_graduate' : 'auto_resolved',
      timestampStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    await enquiry.save();

    res.json({
      success: true,
      triage,
      enquiryId: enquiry._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customer/appointment/:id
 * Live status tracking of an appointment
 */
router.get('/appointment/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name speciality room');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
