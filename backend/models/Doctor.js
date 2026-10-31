const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, index: true },
  qualification: { type: String, required: true },
  speciality: { type: String, required: true },
  room: { type: String, required: true }, // e.g. 'Cabin 1'
  shift: { type: String, default: '09:00 AM - 01:30 PM & 05:00 PM - 08:30 PM' },
  availableDays: { 
    type: [String], 
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] 
  },
  timeSlots: { 
    type: [String], 
    default: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'] 
  },
  isOnDuty: { type: Boolean, default: true },
  maxSlotsToday: { type: Number, default: 20 },
  bookedSlotsToday: { type: Number, default: 0 },
  delayMinutes: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
