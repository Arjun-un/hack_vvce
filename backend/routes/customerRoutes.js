const express = require('express');
const router = express.Router();

const Business = require('../models/Business');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Enquiry = require('../models/Enquiry');
const { processBookingRequest } = require('../services/bookingService');
const { triagePatientMessage, recommendDoctorForSymptoms } = require('../services/geminiService');
const { ensureClinicExists } = require('../services/clinicPresetService');
const { holdSlot, releaseSlotLock, getActiveLocks } = require('../services/slotLockService');

/**
 * GET /api/customer/clinic/:slug
 * Public landing info for QR scan
 */
router.get('/clinic/:slug', async (req, res) => {
  try {
    const business = await ensureClinicExists(req.params.slug);

    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const doctors = await Doctor.find({ businessId: business._id });
    const activeSlotLocks = await getActiveLocks({ businessSlug: req.params.slug });

    res.json({
      business,
      doctors,
      assignedGraduate: business.assignedGraduateId,
      activeSlotLocks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer/hold-slot
 * Hold / reserve a slot for 20 minutes while customer completes booking
 */
router.post('/hold-slot', async (req, res) => {
  try {
    const {
      businessSlug,
      doctorId,
      timeSlot,
      date,
      sessionId,
      patientName,
      patientPhone
    } = req.body;

    if (!doctorId || !timeSlot) {
      return res.status(400).json({ success: false, error: 'Doctor and time slot are required to hold.' });
    }

    const result = await holdSlot({
      businessSlug: businessSlug || 'sanjeevani-clinic',
      doctorId,
      timeSlot,
      date,
      sessionId,
      patientName,
      patientPhone
    });

    if (!result.success) {
      return res.status(409).json(result); // 409 Conflict
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/customer/release-slot
 * Release a hold lock early
 */
router.post('/release-slot', async (req, res) => {
  try {
    const { doctorId, timeSlot, date, sessionId } = req.body;
    const result = await releaseSlotLock({ doctorId, timeSlot, date, sessionId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/customer/active-locks
 * Query active 20-minute locks
 */
router.get('/active-locks', async (req, res) => {
  try {
    const { businessSlug, doctorId, date } = req.query;
    const locks = await getActiveLocks({ businessSlug, doctorId, date });
    res.json({ success: true, locks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
      patientEmail,
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
      patientEmail,
      age,
      gender,
      bloodGroup,
      timeSlot,
      date,
      symptoms,
      sessionId: req.body.sessionId,
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

/**
 * POST /api/customer/triage-symptoms
 * Gemini AI analyzes symptoms and recommends best doctor & slot
 */
router.post('/triage-symptoms', async (req, res) => {
  try {
    const { businessSlug, symptoms, age, gender } = req.body;

    if (!businessSlug || !symptoms) {
      return res.status(400).json({ error: 'businessSlug and symptoms are required' });
    }

    const business = await Business.findOne({ slug: businessSlug });
    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const doctors = await Doctor.find({ businessId: business._id, isOnDuty: true });

    const clinicContext = {
      name: business.name,
      address: business.address,
      operatingHours: business.operatingHours,
      currentStatus: business.currentStatus
    };

    const recommendation = await recommendDoctorForSymptoms({
      symptoms,
      age,
      gender,
      clinicContext,
      doctors
    });

    res.json({
      success: true,
      recommendation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer/network-failure-alert
 * Dispatches an immediate emergency alert to the clinic / hospital & graduate
 * when a patient experiences network failure or connection timeout during booking.
 */
router.post('/network-failure-alert', async (req, res) => {
  try {
    const {
      businessSlug,
      doctorId,
      doctorName,
      patientName,
      patientPhone,
      age,
      gender,
      bloodGroup,
      timeSlot,
      symptoms,
      errorDetails
    } = req.body;

    const business = await ensureClinicExists(businessSlug || 'sanjeevani-clinic');
    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    let resolvedDoctorName = doctorName || 'Consulting Specialist';
    if (doctorId && !doctorName) {
      const doc = await Doctor.findById(doctorId);
      if (doc) resolvedDoctorName = doc.name;
    }

    const NetworkAlert = require('../models/NetworkAlert');
    const GraduateTask = require('../models/GraduateTask');

    // 1. Save NetworkAlert for Clinic Cockpit
    const alert = await NetworkAlert.create({
      businessId: business._id,
      businessSlug: business.slug,
      patientName: patientName || 'Unsaved Patient',
      patientPhone: patientPhone || 'Phone Not Captured',
      age: age ? Number(age) : undefined,
      gender: gender || 'Not specified',
      bloodGroup: bloodGroup || '',
      doctorId: doctorId || null,
      doctorName: resolvedDoctorName,
      timeSlot: timeSlot || 'ASAP',
      symptoms: symptoms || 'General Consultation',
      errorReason: errorDetails || 'Patient mobile internet dropped or timed out during booking submission'
    });

    // 2. Automatically escalate to Graduate Task Queue
    const graduateId = business.assignedGraduateId || '6ae45e8894ef5a16781079e1';
    await GraduateTask.create({
      graduateId,
      businessId: business._id,
      type: 'customer_network_drop',
      customerName: patientName || 'Unsaved Patient',
      customerPhone: patientPhone || 'Phone Not Captured',
      details: `🚨 NETWORK DROP ALERT: Patient ${patientName} (${patientPhone}) experienced a connection timeout while reserving ${timeSlot} with ${resolvedDoctorName}. Immediate hospital callback advised.`,
      priority: 'urgent',
      status: 'pending'
    });

    console.log(`[ALERT] Hospital alerted for patient network drop: ${patientName} (${patientPhone}) for ${business.name}`);

    res.status(201).json({
      success: true,
      message: 'Network drop alert received by hospital reception & graduate operations.',
      alertId: alert._id,
      hospitalPhone: business.phone
    });
  } catch (error) {
    console.error('Error logging network drop alert:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

