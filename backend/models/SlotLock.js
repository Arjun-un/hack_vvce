const mongoose = require('mongoose');

const slotLockSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  businessSlug: { type: String, default: 'sanjeevani-clinic' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  doctorName: { type: String, default: '' },
  timeSlot: { type: String, required: true }, // e.g. "10:15 AM"
  date: { type: String, required: true }, // "YYYY-MM-DD"
  patientName: { type: String, default: '' },
  patientPhone: { type: String, default: '' },
  sessionId: { type: String, default: '' }, // unique client session hash
  lockedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true }, // 20 minutes from lockedAt
  status: { 
    type: String, 
    enum: ['active', 'released', 'confirmed'], 
    default: 'active',
    index: true 
  }
});

// Compound index to quickly look up active locks for doctor, date, slot
slotLockSchema.index({ doctorId: 1, date: 1, timeSlot: 1, status: 1 });

module.exports = mongoose.model('SlotLock', slotLockSchema);
