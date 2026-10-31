const SlotLock = require('../models/SlotLock');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Business = require('../models/Business');
const { ensureClinicExists } = require('./clinicPresetService');

const LOCK_DURATION_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

/**
 * Clean up expired locks from the database
 */
async function purgeExpiredLocks() {
  try {
    await SlotLock.deleteMany({
      status: 'active',
      expiresAt: { $lte: new Date() }
    });
  } catch (err) {
    console.warn('Expired lock cleanup notice:', err.message);
  }
}

/**
 * Acquire a 20-minute temporary reservation lock on a slot
 */
async function holdSlot({
  businessSlug = 'sanjeevani-clinic',
  doctorId,
  timeSlot,
  date,
  sessionId,
  patientName = '',
  patientPhone = ''
}) {
  await purgeExpiredLocks();

  const business = await ensureClinicExists(businessSlug);
  if (!business) throw new Error('Clinic not found');

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new Error('Doctor not found');

  const lockDate = date || new Date().toISOString().split('T')[0];
  const now = new Date();

  // 1. Check if slot already has a finalized confirmed appointment
  const existingAppt = await Appointment.findOne({
    businessId: business._id,
    doctorId: doctor._id,
    date: lockDate,
    timeSlot: timeSlot.trim(),
    status: { $in: ['confirmed', 'checked_in', 'in_consultation'] }
  });

  if (existingAppt) {
    return {
      success: false,
      isAlreadyBooked: true,
      message: `Slot ${timeSlot} is already booked and confirmed for Dr. ${doctor.name}.`
    };
  }

  // 2. Check if slot is actively locked by another session
  const activeLock = await SlotLock.findOne({
    doctorId: doctor._id,
    date: lockDate,
    timeSlot: timeSlot.trim(),
    status: 'active',
    expiresAt: { $gt: now }
  });

  if (activeLock) {
    // If the same user/session already holds the lock, renew it
    if (sessionId && activeLock.sessionId === sessionId) {
      const remainingSeconds = Math.max(0, Math.ceil((activeLock.expiresAt - now) / 1000));
      return {
        success: true,
        isOwnLock: true,
        lockId: activeLock._id,
        timeSlot: activeLock.timeSlot,
        remainingSeconds,
        remainingMinutes: Math.ceil(remainingSeconds / 60),
        message: `You currently hold this slot (${Math.ceil(remainingSeconds / 60)} mins remaining).`
      };
    }

    // Locked by another user
    const remainingSeconds = Math.max(0, Math.ceil((activeLock.expiresAt - now) / 1000));
    return {
      success: false,
      isLocked: true,
      remainingSeconds,
      remainingMinutes: Math.ceil(remainingSeconds / 60),
      message: `Slot ${timeSlot} was selected and is blocked for the next ${Math.ceil(remainingSeconds / 60)} minutes by another booking.`
    };
  }

  // 3. Create new 20-minute reservation lock
  const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);
  const newLock = await SlotLock.create({
    businessId: business._id,
    businessSlug: business.slug,
    doctorId: doctor._id,
    doctorName: doctor.name,
    timeSlot: timeSlot.trim(),
    date: lockDate,
    patientName,
    patientPhone,
    sessionId: sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lockedAt: now,
    expiresAt,
    status: 'active'
  });

  console.log(`🔒 Slot ${timeSlot} locked for 20 mins (expires at ${expiresAt.toLocaleTimeString()}) for Dr. ${doctor.name}`);

  return {
    success: true,
    lockId: newLock._id,
    sessionId: newLock.sessionId,
    timeSlot: newLock.timeSlot,
    expiresAt: newLock.expiresAt,
    remainingSeconds: 1200,
    remainingMinutes: 20,
    message: `Slot ${timeSlot} successfully held for 20 minutes.`
  };
}

/**
 * Release a hold lock early (e.g. if user changes their mind or selects another slot)
 */
async function releaseSlotLock({ doctorId, timeSlot, date, sessionId }) {
  try {
    const query = {
      doctorId,
      timeSlot: timeSlot.trim(),
      status: 'active'
    };
    if (date) query.date = date;
    if (sessionId) query.sessionId = sessionId;

    await SlotLock.updateMany(query, { status: 'released' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mark slot lock as confirmed after successful booking
 */
async function confirmSlotLock({ doctorId, timeSlot, date, sessionId }) {
  try {
    const query = {
      doctorId,
      timeSlot: timeSlot.trim(),
      status: 'active'
    };
    if (date) query.date = date;
    if (sessionId) query.sessionId = sessionId;

    await SlotLock.updateMany(query, { status: 'confirmed' });
  } catch (err) {
    console.warn('Slot lock confirmation notice:', err.message);
  }
}

/**
 * Retrieve all currently active 20-minute locks for a clinic / date
 */
async function getActiveLocks({ businessSlug, doctorId, date }) {
  await purgeExpiredLocks();
  const now = new Date();

  const query = {
    status: 'active',
    expiresAt: { $gt: now }
  };

  if (businessSlug) query.businessSlug = businessSlug;
  if (doctorId) query.doctorId = doctorId;
  if (date) query.date = date;

  const locks = await SlotLock.find(query).sort({ expiresAt: 1 });

  return locks.map(lock => {
    const remainingSeconds = Math.max(0, Math.ceil((lock.expiresAt - now) / 1000));
    return {
      id: lock._id,
      doctorId: String(lock.doctorId),
      doctorName: lock.doctorName,
      timeSlot: lock.timeSlot,
      date: lock.date,
      sessionId: lock.sessionId,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      remainingSeconds,
      remainingMinutes: Math.ceil(remainingSeconds / 60)
    };
  });
}

module.exports = {
  holdSlot,
  releaseSlotLock,
  confirmSlotLock,
  getActiveLocks,
  purgeExpiredLocks,
  LOCK_DURATION_MS
};
