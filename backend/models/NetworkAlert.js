const mongoose = require('mongoose');

const networkAlertSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  businessSlug: { type: String, required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, default: 'Not specified' },
  bloodGroup: { type: String, default: '' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  doctorName: { type: String, default: 'General Duty Doctor' },
  timeSlot: { type: String, required: true },
  symptoms: { type: String, default: 'General Consultation' },
  errorReason: { type: String, default: 'Client Network Drop / Connection Timeout during online booking transaction' },
  status: { 
    type: String, 
    enum: ['pending_hospital_review', 'contacted', 'manually_confirmed', 'dismissed'],
    default: 'pending_hospital_review',
    index: true
  },
  resolvedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NetworkAlert', networkAlertSchema);
