const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Business = require('../models/Business');
const GraduateTask = require('../models/GraduateTask');

/**
 * Handles slot validation, appointment creation, and automatic graduate escalation
 */
async function processBookingRequest({
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
  bookingSource = 'qr_ai'
}) {
  const business = await Business.findOne({ slug: businessSlug });
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

  // 4. Create the Appointment
  const appointment = new Appointment({
    tokenNo,
    businessId: business._id,
    doctorId: doctor._id,
    doctorName: doctor.name,
    patientName,
    patientPhone,
    age: age ? Number(age) : undefined,
    gender: gender || 'Not specified',
    bloodGroup: bloodGroup || '',
    timeSlot,
    date: bookingDate,
    symptoms: symptoms || 'General Consultation',
    status: isConflict ? 'pending_graduate_review' : 'confirmed',
    bookingSource,
    conflictReason: isConflict ? conflictReason : '',
    bookedAtTime
  });

  await appointment.save();

  // If confirmed, increment doctor's booked count
  if (!isConflict) {
    await Doctor.findByIdAndUpdate(doctor._id, { $inc: { bookedSlotsToday: 1 } });
  }

  // 5. If Conflict: Automatically create a GraduateTask for Human-in-the-Loop resolution!
  let createdTask = null;
  if (isConflict && business.assignedGraduateId) {
    createdTask = new GraduateTask({
      graduateId: business.assignedGraduateId,
      businessId: business._id,
      appointmentId: appointment._id,
      type: 'slot_conflict',
      customerName: patientName,
      customerPhone: patientPhone,
      details: `${conflictReason} Patient requested ${timeSlot} with Dr. ${doctor.name}. Needs manual reassignment or customer confirmation.`,
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
