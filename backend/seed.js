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

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    // Clear existing collections
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Business.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({}),
      Enquiry.deleteMany({}),
      GraduateTask.deleteMany({})
    ]);

    // 1. Create Users
    console.log('Creating users...');
    const owner = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'dr.rajesh@sanjeevani.com',
      password: 'password123',
      phone: '+91 98450 12345',
      role: 'business_owner'
    });

    const graduate = await User.create({
      name: 'Arjun Mehta',
      email: 'arjun.mehta@opsloop.internal',
      password: 'password123',
      phone: '+91 99887 66554',
      role: 'graduate'
    });

    // 2. Create Business (Clinic)
    console.log('Creating clinic business...');
    const clinic = await Business.create({
      name: 'Sanjeevani Multispeciality Clinic',
      slug: 'sanjeevani-clinic',
      category: 'clinic',
      ownerId: owner._id,
      assignedGraduateId: graduate._id,
      address: 'Shop 14-16, City Center Arcade, Vijayanagar, Mysuru',
      phone: '+91 98450 12345',
      operatingHours: '08:30 AM - 08:30 PM (Mon - Sat)',
      currentStatus: 'open',
      emergencyNotice: 'Dr. Sneha is running 20 mins late due to an emergency pediatric procedure at hospital.',
      hasActiveEmergencyNotice: true,
      services: ['General OPD', 'Pediatrics & Vaccination', 'Joint & Spine Care', 'Dental Clinic']
    });

    // 3. Create Doctors
    console.log('Creating doctors...');
    const doc1 = await Doctor.create({
      businessId: clinic._id,
      name: 'Dr. Rajesh Sharma',
      qualification: 'MBBS, MD (General Medicine)',
      speciality: 'Consultant Physician',
      room: 'Cabin 1',
      shift: '09:00 AM - 01:30 PM & 05:00 PM - 08:30 PM',
      isOnDuty: true,
      maxSlotsToday: 20,
      bookedSlotsToday: 14,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      delayMinutes: 0
    });

    const doc2 = await Doctor.create({
      businessId: clinic._id,
      name: 'Dr. Sneha Kulkarni',
      qualification: 'MBBS, DNB (Pediatrics)',
      speciality: 'Pediatrician & Neonatologist',
      room: 'Cabin 2',
      shift: '10:00 AM - 02:00 PM & 05:30 PM - 08:00 PM',
      isOnDuty: true,
      maxSlotsToday: 16,
      bookedSlotsToday: 13,
      avatar: 'https://images.unsplash.com/photo-1594824813589-3252549d4432?auto=format&fit=crop&q=80&w=200',
      delayMinutes: 20
    });

    const doc3 = await Doctor.create({
      businessId: clinic._id,
      name: 'Dr. Amit Verma',
      qualification: 'MS (Orthopedics), F.I.A.S',
      speciality: 'Joint & Spine Specialist',
      room: 'Cabin 3',
      shift: '04:30 PM - 08:30 PM',
      isOnDuty: false,
      maxSlotsToday: 12,
      bookedSlotsToday: 5,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      delayMinutes: 0
    });

    const doc4 = await Doctor.create({
      businessId: clinic._id,
      name: 'Dr. Priya Nair',
      qualification: 'BDS, MDS (Endodontics)',
      speciality: 'Dental Surgeon',
      room: 'Cabin 4',
      shift: '10:00 AM - 01:00 PM & 04:00 PM - 07:30 PM',
      isOnDuty: true,
      maxSlotsToday: 10,
      bookedSlotsToday: 7,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
      delayMinutes: 0
    });

    // 4. Create Initial Appointments
    console.log('Creating initial appointments...');
    const todayStr = new Date().toISOString().split('T')[0];

    const apt1 = await Appointment.create({
      tokenNo: 'T-01',
      businessId: clinic._id,
      doctorId: doc1._id,
      doctorName: doc1.name,
      patientName: 'Kavita Sundaram',
      patientPhone: '+91 98860 11223',
      timeSlot: '10:00 AM',
      date: todayStr,
      symptoms: 'Fever and throat irritation for 2 days',
      status: 'in_consultation',
      bookingSource: 'qr_ai',
      bookedAtTime: '08:45 AM'
    });

    const apt2 = await Appointment.create({
      tokenNo: 'T-02',
      businessId: clinic._id,
      doctorId: doc2._id,
      doctorName: doc2.name,
      patientName: 'Master Aarav (Mother: Sunita)',
      patientPhone: '+91 97422 33445',
      timeSlot: '10:15 AM',
      date: todayStr,
      symptoms: 'Vaccination dose 3 & mild cold checkup',
      status: 'checked_in',
      bookingSource: 'qr_ai',
      bookedAtTime: '09:05 AM'
    });

    const apt3 = await Appointment.create({
      tokenNo: 'T-03',
      businessId: clinic._id,
      doctorId: doc1._id,
      doctorName: doc1.name,
      patientName: 'Ramesh Babu G.',
      patientPhone: '+91 94481 99887',
      timeSlot: '10:30 AM',
      date: todayStr,
      symptoms: 'Routine BP check & monthly sugar prescription renewal',
      status: 'checked_in',
      bookingSource: 'walk_in',
      bookedAtTime: '09:50 AM'
    });

    const apt4 = await Appointment.create({
      tokenNo: 'T-04',
      businessId: clinic._id,
      doctorId: doc4._id,
      doctorName: doc4.name,
      patientName: 'Deepa Hegde',
      patientPhone: '+91 99001 44556',
      timeSlot: '11:00 AM',
      date: todayStr,
      symptoms: 'Severe lower molar sensitivity and ache',
      status: 'confirmed',
      bookingSource: 'qr_ai',
      bookedAtTime: '09:20 AM'
    });

    const apt5 = await Appointment.create({
      tokenNo: 'T-05',
      businessId: clinic._id,
      doctorId: doc2._id,
      doctorName: doc2.name,
      patientName: 'Mohammed Zameer',
      patientPhone: '+91 98459 77881',
      timeSlot: '11:30 AM',
      date: todayStr,
      symptoms: 'Pediatric cough syrup reaction enquiry + visit',
      status: 'pending_graduate_review',
      bookingSource: 'qr_ai',
      conflictReason: 'Requested overlapping slot with emergency buffer; Graduate reviewing availability.',
      bookedAtTime: '09:35 AM'
    });

    const apt6 = await Appointment.create({
      tokenNo: 'T-06',
      businessId: clinic._id,
      doctorId: doc1._id,
      doctorName: doc1.name,
      patientName: 'B. S. Chandrashekar',
      patientPhone: '+91 94800 22331',
      timeSlot: '09:30 AM',
      date: todayStr,
      symptoms: 'Migraine followup and prescription check',
      status: 'completed',
      bookingSource: 'qr_ai',
      bookedAtTime: '08:15 AM'
    });

    // 5. Create Graduate Task (For the pending exception)
    console.log('Creating graduate exception tasks...');
    await GraduateTask.create({
      graduateId: graduate._id,
      businessId: clinic._id,
      appointmentId: apt5._id,
      type: 'slot_conflict',
      customerName: 'Mohammed Zameer',
      customerPhone: '+91 98459 77881',
      details: 'Patient requested 11:30 AM with Dr. Sneha during emergency procedure delay buffer. Needs reschedule confirmation with parent.',
      priority: 'high',
      status: 'pending'
    });

    // 6. Create AI Enquiries
    console.log('Creating sample Gemini AI enquiries...');
    await Enquiry.create([
      {
        businessId: clinic._id,
        customerName: 'Vikas Rao',
        customerPhone: '+91 98440 55112',
        rawMessage: 'Is Dr. Sneha available today for 2-month vaccine? How much is the consultation?',
        intent: 'general_faq',
        aiConfidence: 0.96,
        aiResponse: 'Yes, Dr. Sneha Kulkarni (Pediatrics) is available today from 10:00 AM to 2:00 PM. General consultation fee is ₹400. You can book an instant slot by replying "Book" or using this portal.',
        status: 'auto_resolved',
        timestampStr: '10:12 AM'
      },
      {
        businessId: clinic._id,
        customerName: 'Ananya Deshmukh',
        customerPhone: '+91 97311 88223',
        rawMessage: 'Need urgent slot with Dr. Amit for knee sprain around 1:30 PM if possible please',
        intent: 'appointment_conflict',
        aiConfidence: 0.88,
        aiResponse: 'Dr. Amit Verma is on duty from 4:30 PM today. Forwarding your request to Arjun Mehta (OpsLoop Graduate) to assist you with the earliest available evening slot.',
        status: 'assigned_to_graduate',
        timestampStr: '09:48 AM'
      },
      {
        businessId: clinic._id,
        customerName: 'Prashanth M.',
        customerPhone: '+91 99801 12389',
        rawMessage: 'Do you accept Bajaj Health Insurance cards for dental OP?',
        intent: 'general_faq',
        aiConfidence: 0.94,
        aiResponse: 'Yes, Bajaj Allianz Health & Star Health are accepted for eligible dental procedures at Sanjeevani Clinic. Please present your policy card at the reception counter.',
        status: 'auto_resolved',
        timestampStr: '09:15 AM'
      },
      {
        businessId: clinic._id,
        customerName: 'Latha Srinivas',
        customerPhone: '+91 94490 66778',
        rawMessage: 'My father has severe chest tightness and sweating right now, can we bring him in?',
        intent: 'emergency_escalation',
        aiConfidence: 0.99,
        aiResponse: '⚠️ CRITICAL: For severe chest discomfort, please proceed immediately to the nearest Emergency Casualty (Apollo Hospital, 1.2 km away) or dial 108. Clinic OPD is not equipped for acute cardiac emergency resuscitation.',
        status: 'auto_resolved',
        timestampStr: '08:50 AM'
      }
    ]);

    console.log('✅ Database successfully seeded with 3-Role Workflow data!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
