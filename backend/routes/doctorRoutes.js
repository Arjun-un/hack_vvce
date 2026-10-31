const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { ensureClinicExists } = require('../services/clinicPresetService');

/**
 * Helper to resolve doctor profile for the current authenticated user
 */
async function resolveDoctorForUser(user) {
  // 1. If user already has doctorId attached
  if (user.doctorId) {
    const doc = await Doctor.findById(user.doctorId).populate('businessId');
    if (doc) return doc;
  }

  // 2. Try matching by email
  let doc = await Doctor.findOne({ email: user.email.toLowerCase() }).populate('businessId');
  if (doc) {
    await User.findByIdAndUpdate(user.id || user._id, { doctorId: doc._id });
    return doc;
  }

  // 3. Try matching by doctor name in User
  const cleanName = user.name ? user.name.trim() : '';
  doc = await Doctor.findOne({ name: { $regex: cleanName, $options: 'i' } }).populate('businessId');
  if (doc) {
    await User.findByIdAndUpdate(user.id || user._id, { doctorId: doc._id });
    return doc;
  }

  // 4. Fallback: Ensure default Sanjeevani clinic and link first or matching doctor
  const sanjeevani = await ensureClinicExists('sanjeevani-clinic');
  if (sanjeevani) {
    doc = await Doctor.findOne({
      businessId: sanjeevani._id,
      name: { $regex: 'Sneha', $options: 'i' }
    }).populate('businessId');

    if (!doc) {
      doc = await Doctor.findOne({ businessId: sanjeevani._id }).populate('businessId');
    }

    if (doc) {
      await User.findByIdAndUpdate(user.id || user._id, { doctorId: doc._id });
      return doc;
    }
  }

  return null;
}

/**
 * GET /api/doctor/profile
 * Returns logged-in doctor profile, clinic info, and active time slots
 */
router.get('/profile', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found for current user account.' });
    }

    const business = doctor.businessId || await Business.findById(doctor.businessId);

    res.json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        qualification: doctor.qualification,
        speciality: doctor.speciality,
        room: doctor.room,
        shift: doctor.shift,
        availableDays: doctor.availableDays,
        timeSlots: doctor.timeSlots,
        isOnDuty: doctor.isOnDuty,
        maxSlotsToday: doctor.maxSlotsToday,
        bookedSlotsToday: doctor.bookedSlotsToday,
        delayMinutes: doctor.delayMinutes,
        avatar: doctor.avatar,
        email: doctor.email || req.user.email
      },
      clinic: business ? {
        id: business._id,
        name: business.name,
        slug: business.slug,
        address: business.address,
        currentStatus: business.currentStatus,
        phone: business.phone
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/doctor/slots
 * Doctor decides and updates their available time slots & duty status
 */
router.put('/slots', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor record not found.' });
    }

    const { timeSlots, shift, isOnDuty, delayMinutes, maxSlotsToday } = req.body;

    const updates = {};
    if (Array.isArray(timeSlots)) {
      // Ensure unique and trimmed slots
      updates.timeSlots = Array.from(new Set(timeSlots.map(s => s.trim()))).filter(Boolean);
    }
    if (shift !== undefined) updates.shift = shift;
    if (isOnDuty !== undefined) updates.isOnDuty = Boolean(isOnDuty);
    if (delayMinutes !== undefined) updates.delayMinutes = Number(delayMinutes);
    if (maxSlotsToday !== undefined) updates.maxSlotsToday = Number(maxSlotsToday);

    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, updates, { new: true });

    res.json({
      success: true,
      message: 'Time slots and schedule successfully updated by Doctor.',
      doctor: updatedDoctor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/doctor/appointments
 * Retrieves all appointments assigned to this doctor (categorized by acceptance status)
 */
router.get('/appointments', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor record not found.' });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate queue metrics
    const pendingAcceptance = appointments.filter(a => a.status === 'pending_doctor_acceptance' || (!a.doctorAccepted && a.status !== 'cancelled' && a.status !== 'completed'));
    const confirmedToday = appointments.filter(a => a.status === 'confirmed' || a.status === 'checked_in');
    const inConsultation = appointments.filter(a => a.status === 'in_consultation');
    const completedToday = appointments.filter(a => a.status === 'completed');

    res.json({
      success: true,
      appointments,
      metrics: {
        total: appointments.length,
        pendingAcceptanceCount: pendingAcceptance.length,
        confirmedCount: confirmedToday.length,
        inConsultationCount: inConsultation.length,
        completedCount: completedToday.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/doctor/appointments/:id/accept
 * Doctor accepts patient slot request, officially confirming the booking
 */
router.put('/appointments/:id/accept', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Verify appointment belongs to this doctor
    if (String(appointment.doctorId) !== String(doctor._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to accept appointments for another doctor.' });
    }

    appointment.status = 'confirmed';
    appointment.doctorAccepted = true;
    appointment.acceptedAt = new Date();
    if (req.body.doctorNotes) {
      appointment.doctorNotes = req.body.doctorNotes;
    }

    await appointment.save();

    // Increment booked count for the doctor
    await Doctor.findByIdAndUpdate(doctor._id, { $inc: { bookedSlotsToday: 1 } });

    res.json({
      success: true,
      message: `Appointment for ${appointment.patientName} at ${appointment.timeSlot} accepted and confirmed.`,
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/doctor/appointments/:id/status
 * Doctor updates appointment status (in_consultation, completed, cancelled) and prescription notes
 */
router.put('/appointments/:id/status', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const { status, doctorNotes } = req.body;
    const allowed = ['checked_in', 'in_consultation', 'completed', 'cancelled'];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status.' });
    }

    if (status) appointment.status = status;
    if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;

    await appointment.save();

    res.json({
      success: true,
      message: `Appointment updated to '${appointment.status}'.`,
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
