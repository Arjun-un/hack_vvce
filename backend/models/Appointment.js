const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  tokenNo: { type: String, required: true }, // e.g. 'T-01'
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName: { type: String, required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientEmail: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: 'Not specified' },
  bloodGroup: { type: String, default: '' },
  timeSlot: { type: String, required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  symptoms: { type: String, default: 'General Consultation' },
  status: { 
    type: String, 
    enum: [
      'pending_doctor_acceptance',
      'confirmed', 
      'checked_in', 
      'in_consultation', 
      'completed', 
      'pending_graduate_review', 
      'cancelled'
    ], 
    default: 'pending_doctor_acceptance',
    index: true
  },
  doctorAccepted: { type: Boolean, default: false },
  acceptedAt: { type: Date },
  doctorNotes: { type: String, default: '' },
  bookingSource: { 
    type: String, 
    enum: ['qr_ai', 'walk_in'], 
    default: 'qr_ai' 
  },
  conflictReason: { type: String, default: '' },
  graduateResolutionNotes: { type: String, default: '' },
  resolvedByGraduateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookedAtTime: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
