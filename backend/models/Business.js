const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { 
    type: String, 
    enum: ['clinic', 'coaching_center', 'salon'], 
    default: 'clinic' 
  },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedGraduateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  operatingHours: { type: String, default: '08:30 AM - 08:30 PM (Mon - Sat)' },
  currentStatus: { 
    type: String, 
    enum: ['open', 'lunch_break', 'emergency_only', 'closed'], 
    default: 'open' 
  },
  emergencyNotice: { type: String, default: '' },
  hasActiveEmergencyNotice: { type: Boolean, default: false },
  qrCodeUrl: { type: String, default: '' },
  services: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', businessSchema);
