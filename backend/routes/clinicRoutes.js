const express = require('express');
const router = express.Router();

const Business = require('../models/Business');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const GraduateTask = require('../models/GraduateTask');
const NetworkAlert = require('../models/NetworkAlert');
const { processBookingRequest } = require('../services/bookingService');
const { ensureClinicExists } = require('../services/clinicPresetService');
const { holdSlot, releaseSlotLock, getActiveLocks } = require('../services/slotLockService');

/**
 * GET /api/clinic/:slug/dashboard
 * Complete real-time state for the Clinic Owner Cockpit
 */
router.get('/:slug/dashboard', async (req, res) => {
  try {
    const business = await ensureClinicExists(req.params.slug);

    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [doctors, appointments, aiInquiries, graduateTasks, networkAlerts, activeSlotLocks] = await Promise.all([
      Doctor.find({ businessId: business._id }),
      Appointment.find({ businessId: business._id }).sort({ createdAt: -1 }),
      Enquiry.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(10),
      GraduateTask.find({ businessId: business._id, status: 'pending' }),
      NetworkAlert.find({ businessId: business._id, status: 'pending_hospital_review' }).sort({ createdAt: -1 }),
      getActiveLocks({ businessSlug: business.slug, date: todayStr })
    ]);

    // Format assigned graduate stats
    let graduateData = null;
    if (business.assignedGraduateId) {
      const gradUser = business.assignedGraduateId;
      const resolvedTasksCount = await GraduateTask.countDocuments({
        graduateId: gradUser._id,
        status: 'resolved'
      });

      graduateData = {
        id: gradUser._id,
        name: gradUser.name,
        title: 'OpsLoop Certified Automation Specialist',
        phone: gradUser.phone,
        email: gradUser.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status: 'online',
        tasksAssignedToday: graduateTasks.length + resolvedTasksCount,
        tasksResolvedToday: resolvedTasksCount
      };
    }

    res.json({
      business,
      doctors,
      appointments,
      aiInquiries,
      networkAlerts,
      networkAlertsCount: networkAlerts.length,
      assignedGraduate: graduateData,
      pendingReviewsCount: graduateTasks.length,
      activeSlotLocks: activeSlotLocks || [],
      publicUrl: req.app.locals.publicUrl || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clinic/:slug/status
 * Toggle operational status (open, lunch_break, emergency_only, closed)
 */
router.put('/:slug/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'lunch_break', 'emergency_only', 'closed'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid clinic status' });
    }

    const business = await Business.findOneAndUpdate(
      { slug: req.params.slug },
      { currentStatus: status },
      { new: true }
    );

    res.json({ success: true, currentStatus: business.currentStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clinic/:slug/emergency-broadcast
 * Set or dismiss live emergency & delay broadcast
 */
router.put('/:slug/emergency-broadcast', async (req, res) => {
  try {
    const { notice, isActive } = req.body;

    const business = await Business.findOneAndUpdate(
      { slug: req.params.slug },
      { 
        emergencyNotice: notice || '',
        hasActiveEmergencyNotice: Boolean(isActive)
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      emergencyNotice: business.emergencyNotice,
      hasActiveEmergencyNotice: business.hasActiveEmergencyNotice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clinic/appointments/walk-in
 * Register a front-desk walk-in patient directly into the live queue
 */
router.post('/appointments/walk-in', async (req, res) => {
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
      symptoms
    } = req.body;

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
      symptoms,
      bookingSource: 'walk_in'
    });

    // Walk-ins are placed directly in checked_in waiting room
    const updatedApt = await Appointment.findByIdAndUpdate(
      result.appointment._id,
      { status: 'checked_in' },
      { new: true }
    );

    res.status(201).json({ success: true, appointment: updatedApt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clinic/appointments/:id/status
 * Progress patient through the queue (checked_in, in_consultation, completed, cancelled)
 */
router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clinic/doctors/:id/duty
 * Toggle doctor on/off duty
 */
router.put('/doctors/:id/duty', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    doctor.isOnDuty = !doctor.isOnDuty;
    await doctor.save();

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clinic/doctors/:id/delay
 * Set doctor delay notice in minutes
 */
router.put('/doctors/:id/delay', async (req, res) => {
  try {
    const { delayMinutes } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { delayMinutes: Number(delayMinutes) || 0 },
      { new: true }
    );

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clinic/network-alerts/:id/confirm
 * Hospital clicks "Confirm as Walk-in" to convert a dropped online booking into a confirmed token
 */
router.post('/network-alerts/:id/confirm', async (req, res) => {
  try {
    const alert = await NetworkAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Network alert not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const countToday = await Appointment.countDocuments({
      businessId: alert.businessId,
      date: todayStr
    });
    const tokenNo = `T-${String(countToday + 1).padStart(2, '0')}`;

    // Create confirmed appointment
    const appointment = await Appointment.create({
      tokenNo,
      businessId: alert.businessId,
      doctorId: alert.doctorId || alert.businessId,
      doctorName: alert.doctorName || 'Consulting Doctor',
      patientName: alert.patientName,
      patientPhone: alert.patientPhone,
      age: alert.age,
      gender: alert.gender,
      bloodGroup: alert.bloodGroup,
      timeSlot: alert.timeSlot,
      date: todayStr,
      symptoms: `${alert.symptoms} (Recovered from network drop alert)`,
      status: 'confirmed',
      doctorAccepted: true,
      bookingSource: 'walk_in',
      bookedAtTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Mark alert as manually confirmed
    alert.status = 'manually_confirmed';
    alert.resolvedAppointmentId = appointment._id;
    await alert.save();

    // Mark graduate task resolved
    await GraduateTask.updateMany(
      { customerPhone: alert.patientPhone, type: 'customer_network_drop' },
      { status: 'resolved', resolutionNote: `Manually confirmed by Hospital reception. Token: ${tokenNo}`, resolvedAt: new Date() }
    );

    res.json({
      success: true,
      message: `Appointment confirmed for ${alert.patientName}. Token ${tokenNo} issued.`,
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clinic/network-alerts/:id/status
 * Dismiss or mark contacted for a network alert
 */
router.put('/network-alerts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await NetworkAlert.findByIdAndUpdate(
      req.params.id,
      { status: status || 'contacted' },
      { new: true }
    );
    res.json({ success: true, alert });
  } catch (error) {
/**
 * POST /api/clinic/slots/hold
 * Client / Clinic chooses a slot and blocks it for the next 20 minutes
 */
router.post('/slots/hold', async (req, res) => {
  try {
    const { businessSlug, doctorId, timeSlot, date, notes } = req.body;
    const result = await holdSlot({
      businessSlug: businessSlug || 'sanjeevani-clinic',
      doctorId,
      timeSlot,
      date,
      sessionId: 'client_clinic_desk',
      patientName: notes || 'Blocked by Clinic Staff / Reception'
    });

    if (!result.success) {
      return res.status(409).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clinic/slots/release
 * Client / Clinic manually unblocks / releases a held slot
 */
router.post('/slots/release', async (req, res) => {
  try {
    const { doctorId, timeSlot, date } = req.body;
    const result = await releaseSlotLock({ doctorId, timeSlot, date });
    res.json({ success: true, message: `Slot ${timeSlot} unblocked successfully.`, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clinic/:slug/slots/active-locks
 * Query active slot locks for this clinic
 */
router.get('/:slug/slots/active-locks', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const locks = await getActiveLocks({
      businessSlug: req.params.slug,
      doctorId,
      date: date || new Date().toISOString().split('T')[0]
    });
    res.json({ success: true, locks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
