const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  customerName: { type: String, default: 'Guest Patient' },
  customerPhone: { type: String, default: '' },
  rawMessage: { type: String, required: true },
  intent: { 
    type: String, 
    enum: [
      'general_faq', 
      'appointment_booking', 
      'appointment_conflict', 
      'emergency_escalation'
    ], 
    default: 'general_faq' 
  },
  aiResponse: { type: String, default: '' },
  aiConfidence: { type: Number, default: 0.95 },
  status: { 
    type: String, 
    enum: ['auto_resolved', 'assigned_to_graduate', 'closed'], 
    default: 'auto_resolved' 
  },
  timestampStr: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
