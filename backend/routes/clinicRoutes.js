const express = require('express');
const router = express.Router();

const Business = require('../models/Business');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const GraduateTask = require('../models/GraduateTask');
const { processBookingRequest } = require('../services/bookingService');

/**
 * GET /api/clinic/:slug/dashboard
 * Complete real-time state for the Clinic Owner Cockpit
 */
router.get('/:slug/dashboard', async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug })
      .populate('assignedGraduateId', 'name phone email');

    if (!business) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [doctors, appointments, aiInquiries, graduateTasks] = await Promise.all([
      Doctor.find({ businessId: business._id }),
      Appointment.find({ businessId: business._id }).sort({ createdAt: -1 }),
      Enquiry.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(10),
      GraduateTask.find({ businessId: business._id, status: 'pending' })
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
      assignedGraduate: graduateData,
      pendingReviewsCount: graduateTasks.length,
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

module.exports = router;
