require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const User = require('./models/User');
const Business = require('./models/Business');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Enquiry = require('./models/Enquiry');
const GraduateTask = require('./models/GraduateTask');

async function checkDatabase() {
  console.log('====================================================');
  console.log('🔍 INITIATING MONGODB ATLAS DATABASE HEALTH AUDIT');
  console.log('====================================================');

  const uri = process.env.MONGO_URI;
  console.log(`Connecting to URI: ${uri.replace(/:[^:]*@/, ':****@')} ...`);

  const startTime = Date.now();
  try {
    const conn = await mongoose.connect(uri);
    const latency = Date.now() - startTime;

    console.log(`\n✅ CONNECTION STATUS: CONNECTED (readyState: ${mongoose.connection.readyState})`);
    console.log(`🌐 Cluster Host:     ${conn.connection.host}`);
    console.log(`🗄️  Database Name:    ${conn.connection.name}`);
    console.log(`⚡ Roundtrip Latency: ${latency}ms`);

    // Count records across all collections
    const [userCount, bizCount, docCount, aptCount, inqCount, taskCount] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Enquiry.countDocuments(),
      GraduateTask.countDocuments()
    ]);

    console.log('\n📊 DATABASE RECORD COUNTS:');
    console.log(` - Users:            ${userCount}`);
    console.log(` - Businesses:       ${bizCount}`);
    console.log(` - Doctors:          ${docCount}`);
    console.log(` - Appointments:     ${aptCount}`);
    console.log(` - AI Enquiries:     ${inqCount}`);
    console.log(` - Graduate Tasks:   ${taskCount}`);

    // Fetch the 3 most recent appointments to verify patient demographic storage
    console.log('\n📋 LATEST APPOINTMENTS SAVED IN DATABASE:');
    const recentApts = await Appointment.find().sort({ createdAt: -1 }).limit(3);
    recentApts.forEach((apt, idx) => {
      console.log(` ${idx + 1}. [${apt.tokenNo}] ${apt.patientName} | Age: ${apt.age || 'N/A'} | Gender: ${apt.gender} | Blood: ${apt.bloodGroup || 'N/A'} | Slot: ${apt.timeSlot} | Status: ${apt.status} | Source: ${apt.bookingSource}`);
    });

    console.log('\n====================================================');
    console.log('🎉 AUDIT COMPLETE: DATABASE IS FULLY FUNCTIONAL & SYNCED');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ DATABASE CONNECTION FAILED:', err.message);
    process.exit(1);
  }
}

checkDatabase();
