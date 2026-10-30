const mongoose = require('mongoose');

const graduateTaskSchema = new mongoose.Schema({
  graduateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
  type: { 
    type: String, 
    enum: [
      'slot_conflict', 
      'off_schedule_request', 
      'doctor_delay_reassignment', 
      'unclear_enquiry'
    ], 
    required: true 
  },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  details: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved'], 
    default: 'pending',
    index: true 
  },
  resolutionNote: { type: String, default: '' },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GraduateTask', graduateTaskSchema);
