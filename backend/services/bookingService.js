const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Business = require('../models/Business');
const GraduateTask = require('../models/GraduateTask');
const SlotLock = require('../models/SlotLock');
const { ensureClinicExists } = require('./clinicPresetService');
const { sendBookingConfirmationEmail } = require('./emailService');
const { confirmSlotLock } = require('./slotLockService');

/**
 * Handles slot validation, appointment creation, and automatic graduate escalation
 */
async function processBookingRequest({
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
  sessionId,
  bookingSource = 'qr_ai'
}) {
  const business = await ensureClinicExists(businessSlug);
  if (!business) {
    throw new Error('Clinic not found');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  // Generate today's date string if not passed
  const bookingDate = date || new Date().toISOString().split('T')[0];

  // Count existing appointments today for next token
  const countToday = await Appointment.countDocuments({
    businessId: business._id,
    date: bookingDate
  });
  const tokenNo = `T-${String(countToday + 1).padStart(2, '0')}`;
  const bookedAtTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Conflict Check: Is the doctor ON DUTY?
  let isConflict = false;
  let conflictReason = '';

  if (!doctor.isOnDuty) {
    isConflict = true;
    conflictReason = `Dr. ${doctor.name} is currently marked OFF DUTY for this shift.`;
  }

  // 2. Conflict Check: Is the clinic CLOSED or LUNCH BREAK?
  if (business.currentStatus === 'closed') {
    isConflict = true;
    conflictReason = 'Clinic is currently CLOSED for consultations today.';
  } else if (business.currentStatus === 'lunch_break' && (timeSlot.includes('01:') || timeSlot.includes('02:'))) {
    isConflict = true;
    conflictReason = 'Requested slot falls during doctors scheduled afternoon lunch break.';
  }

  // 3. Conflict Check: Is slot already taken by another confirmed/checked-in patient?
  const existingSlot = await Appointment.findOne({
    businessId: business._id,
    doctorId: doctor._id,
    date: bookingDate,
    timeSlot: timeSlot,
    status: { $in: ['confirmed', 'checked_in', 'in_consultation'] }
  });

  if (existingSlot) {
    isConflict = true;
    conflictReason = `Time slot ${timeSlot} is already booked for Dr. ${doctor.name}.`;
  }

  // 4. Conflict Check: Is slot currently locked by another customer/session within 20 mins?
  const activeLock = await SlotLock.findOne({
    doctorId: doctor._id,
    date: bookingDate,
    timeSlot: timeSlot.trim(),
    status: 'active',
    expiresAt: { $gt: new Date() }
  });

  if (activeLock && (!sessionId || activeLock.sessionId !== sessionId)) {
    const remainingMins = Math.max(1, Math.ceil((activeLock.expiresAt - new Date()) / 60000));
    isConflict = true;
    conflictReason = `Slot ${timeSlot} is currently held by another patient or clinic (locked for ${remainingMins} more mins).`;
  }

  // 5. Create the Appointment
  const appointment = new Appointment({
    tokenNo,
    businessId: business._id,
    doctorId: doctor._id,
    doctorName: doctor.name,
    patientName,
    patientPhone,
    patientEmail: patientEmail || '',
    age: age ? Number(age) : undefined,
    gender: gender || 'Not specified',
    bloodGroup: bloodGroup || '',
    timeSlot,
    date: bookingDate,
    symptoms: symptoms || 'General Consultation',
    status: isConflict ? 'pending_graduate_review' : 'pending_doctor_acceptance',
    doctorAccepted: false,
    bookingSource,
    conflictReason: isConflict ? conflictReason : '',
    bookedAtTime
  });

  await appointment.save();

  // If confirmed, increment doctor's booked count and log AI auto-completed task for Graduate
  let createdTask = null;
  const graduateId = business.assignedGraduateId || '6ae45e8894ef5a16781079e1';

  if (!isConflict) {
    await Doctor.findByIdAndUpdate(doctor._id, { $inc: { bookedSlotsToday: 1 } });

    // Mark reservation lock as confirmed
    await confirmSlotLock({ doctorId: doctor._id, timeSlot, date: bookingDate, sessionId });

    // Send confirmation email asynchronously (never blocking customer UI)
    sendBookingConfirmationEmail({
      appointment,
      clinic: business,
      doctor
    }).catch(err => console.error('Error dispatching booking confirmation email:', err.message));

    // Inform Graduate Dashboard that this task was auto-completed by AI
    createdTask = new GraduateTask({
      graduateId,
      businessId: business._id,
      appointmentId: appointment._id,
      type: 'ai_auto_approved',
      customerName: patientName,
      customerPhone: patientPhone,
      details: `AI validated input & schedule. Auto-approved Token ${tokenNo} for Dr. ${doctor.name} at ${timeSlot} with 0 conflicts.`,
      priority: 'low',
      status: 'resolved',
      resolutionNote: 'Auto-completed by Gemini AI Workflow Engine.',
      resolvedAt: new Date()
    });
    await createdTask.save();
  } else {
    // 5. If Conflict: Automatically create a GraduateTask for Human-in-the-Loop resolution!
    createdTask = new GraduateTask({
      graduateId,
      businessId: business._id,
      appointmentId: appointment._id,
      type: 'slot_conflict',
      customerName: patientName,
      customerPhone: patientPhone,
      details: `${conflictReason} Patient requested ${timeSlot} with Dr. ${doctor.name}. Needs specialist reassignment or customer confirmation.`,
      priority: 'high',
      status: 'pending'
    });
    await createdTask.save();
  }

  return {
    appointment,
    isConflict,
    conflictReason,
    graduateTaskId: createdTask ? createdTask._id : null
  };
}

module.exports = { processBookingRequest };
