const Business = require('../models/Business');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const CLINIC_PRESETS = {
  'sanjeevani-clinic': {
    name: 'Sanjeevani Multispeciality Clinic',
    category: 'Multi-Speciality OPD & Emergency Care',
    address: '14th Cross, Ashok Nagar, Mysuru, Karnataka',
    phone: '+91 98450 12345',
    operatingHours: '08:30 AM - 08:30 PM (Mon - Sat)',
    currentStatus: 'open',
    emergencyNotice: 'Dr. Sneha is running 20 mins late due to an emergency pediatric procedure at hospital.',
    hasActiveEmergencyNotice: true,
    services: ['General OPD', 'Pediatrics & Vaccination', 'Joint & Spine Care', 'Dental Clinic'],
    doctors: [
      {
        name: 'Dr. Rajesh Sharma',
        qualification: 'MBBS, MD (General Medicine)',
        speciality: 'Consultant Physician',
        room: 'Cabin 1',
        shift: '09:00 AM - 01:30 PM & 05:00 PM - 08:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 20,
        bookedSlotsToday: 14,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Sneha Kulkarni',
        qualification: 'MBBS, DNB (Pediatrics)',
        speciality: 'Pediatrician & Neonatologist',
        room: 'Cabin 2',
        shift: '10:00 AM - 02:00 PM & 05:30 PM - 08:00 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 16,
        bookedSlotsToday: 13,
        delayMinutes: 20,
        avatar: 'https://images.unsplash.com/photo-1594824813589-3252549d4432?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Amit Verma',
        qualification: 'MS (Orthopedics), F.I.A.S',
        speciality: 'Joint & Spine Specialist',
        room: 'Cabin 3',
        shift: '04:30 PM - 08:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 12,
        bookedSlotsToday: 5,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Priya Nair',
        qualification: 'BDS, MDS (Endodontics)',
        speciality: 'Dental Surgeon',
        room: 'Cabin 4',
        shift: '10:00 AM - 01:00 PM & 04:00 PM - 07:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 10,
        bookedSlotsToday: 7,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
      }
    ]
  },
  'greenlife-clinic': {
    name: 'GreenLife Clinic',
    category: 'Multi-Speciality & Dentistry',
    address: '14th Cross, Indiranagar, Bengaluru',
    phone: '+91 98450 12345',
    operatingHours: '09:00 AM - 08:30 PM (Mon - Sat)',
    currentStatus: 'open',
    emergencyNotice: '',
    hasActiveEmergencyNotice: false,
    services: ['General Medicine', 'Dentistry & Orthodontics', 'Pediatrics'],
    doctors: [
      {
        name: 'Dr. Ramesh Kumar',
        qualification: 'MBBS, MD (General Medicine)',
        speciality: 'General Physician & Diabetologist',
        room: 'Cabin 1',
        shift: '09:00 AM - 01:00 PM & 05:00 PM - 08:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['09:30 AM', '10:00 AM', '11:30 AM', '04:00 PM', '05:30 PM', '06:30 PM'],
        isOnDuty: true,
        maxSlotsToday: 18,
        bookedSlotsToday: 8,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Priya Sharma',
        qualification: 'BDS, MDS (Orthodontics)',
        speciality: 'Dentist & Orthodontist',
        room: 'Cabin 2',
        shift: '10:00 AM - 02:00 PM & 04:30 PM - 08:00 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '10:30 AM', '11:30 AM', '04:30 PM', '05:30 PM', '06:30 PM'],
        isOnDuty: true,
        maxSlotsToday: 14,
        bookedSlotsToday: 6,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Ananya Sen',
        qualification: 'MBBS, DNB (Pediatrics)',
        speciality: 'Pediatric Specialist',
        room: 'Cabin 3',
        shift: '11:00 AM - 03:00 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['11:00 AM', '11:30 AM', '12:00 PM', '01:30 PM', '02:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 12,
        bookedSlotsToday: 5,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1594824813589-3252549d4432?auto=format&fit=crop&q=80&w=200'
      }
    ]
  },
  'citycare-medical': {
    name: 'CityCare Medical Centre',
    category: 'Family Medicine & Diagnostics',
    address: 'Brigade Road, Bengaluru',
    phone: '+91 98450 67890',
    operatingHours: '08:00 AM - 09:00 PM (Mon - Sat)',
    currentStatus: 'open',
    emergencyNotice: '',
    hasActiveEmergencyNotice: false,
    services: ['Family Medicine', 'Cardiology & ECG', 'Diagnostic Pathology'],
    doctors: [
      {
        name: 'Dr. Vikram Seth',
        qualification: 'MBBS, MD (Internal Medicine)',
        speciality: 'Chief Medical Consultant',
        room: 'Cabin 1',
        shift: '09:30 AM - 01:30 PM & 05:00 PM - 08:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '10:30 AM', '03:00 PM', '04:30 PM', '07:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 20,
        bookedSlotsToday: 11,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Kavita Nair',
        qualification: 'MD, DM (Cardiology)',
        speciality: 'Cardiology & Internal Medicine',
        room: 'Cabin 2',
        shift: '10:00 AM - 02:00 PM & 04:00 PM - 07:00 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timeSlots: ['10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM', '06:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 15,
        bookedSlotsToday: 7,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1594824813589-3252549d4432?auto=format&fit=crop&q=80&w=200'
      }
    ]
  },
  'sunrise-family': {
    name: 'Sunrise Family Clinic',
    category: 'Pediatrics & General Care',
    address: 'Koramangala 4th Block, Bengaluru',
    phone: '+91 98450 11223',
    operatingHours: '09:00 AM - 08:00 PM (Mon - Sat)',
    currentStatus: 'open',
    emergencyNotice: '',
    hasActiveEmergencyNotice: false,
    services: ['Pediatrics & Child Health', 'General OPD', 'Vaccination'],
    doctors: [
      {
        name: 'Dr. Neha Varma',
        qualification: 'MBBS, MD (Pediatrics)',
        speciality: 'Pediatrician & Child Health',
        room: 'Cabin 1',
        shift: '09:00 AM - 01:00 PM & 04:30 PM - 08:00 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 16,
        bookedSlotsToday: 9,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1594824813589-3252549d4432?auto=format&fit=crop&q=80&w=200'
      }
    ]
  },
  'primecare-health': {
    name: 'PrimeCare Health',
    category: 'Orthopedics & Physiotherapy',
    address: 'JP Nagar 2nd Phase, Bengaluru',
    phone: '+91 98450 44556',
    operatingHours: '09:00 AM - 08:30 PM (Mon - Sat)',
    currentStatus: 'open',
    emergencyNotice: '',
    hasActiveEmergencyNotice: false,
    services: ['Orthopedics & Trauma', 'Physiotherapy & Rehab', 'Sports Medicine'],
    doctors: [
      {
        name: 'Dr. Arvind Swamy',
        qualification: 'MS (Orthopedics), M.Ch',
        speciality: 'Senior Orthopedic Surgeon',
        room: 'Cabin 1',
        shift: '09:30 AM - 01:30 PM & 05:00 PM - 08:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '11:00 AM', '05:00 PM', '06:00 PM'],
        isOnDuty: true,
        maxSlotsToday: 15,
        bookedSlotsToday: 8,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Dr. Meera Reddy',
        qualification: 'BPT, MPT (Sports Rehab)',
        speciality: 'Sports Medicine & Physiotherapy',
        room: 'Cabin 2',
        shift: '10:00 AM - 02:00 PM & 04:00 PM - 07:30 PM',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['10:30 AM', '11:30 AM', '04:30 PM', '05:30 PM'],
        isOnDuty: true,
        maxSlotsToday: 12,
        bookedSlotsToday: 4,
        delayMinutes: 0,
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
      }
    ]
  }
};

/**
 * Ensures a clinic exists in MongoDB. If not present, auto-provisions it with doctors.
 */
async function ensureClinicExists(slug) {
  let business = await Business.findOne({ slug })
    .populate('assignedGraduateId', 'name phone email');

  if (business) return business;

  const preset = CLINIC_PRESETS[slug];
  if (!preset) return null;

  // Find or create default graduate user
  let graduate = await User.findOne({ role: 'graduate' });
  if (!graduate) {
    graduate = await User.create({
      name: 'Arjun Mehta',
      email: 'arjun.mehta@opsloop.internal',
      password: 'password123',
      phone: '+91 99887 66554',
      role: 'graduate'
    });
  }

  // Find or create default owner
  let owner = await User.findOne({ role: 'business_owner' });
  if (!owner) {
    owner = await User.create({
      name: `${preset.name} Administrator`,
      email: `admin@${slug}.com`,
      password: 'password123',
      phone: preset.phone,
      role: 'business_owner'
    });
  }

  // Create Business
  business = await Business.create({
    name: preset.name,
    slug,
    category: 'clinic',
    ownerId: owner._id,
    assignedGraduateId: graduate._id,
    address: preset.address,
    phone: preset.phone,
    operatingHours: preset.operatingHours,
    currentStatus: preset.currentStatus,
    emergencyNotice: preset.emergencyNotice || '',
    hasActiveEmergencyNotice: Boolean(preset.hasActiveEmergencyNotice),
    services: preset.services || ['General OPD']
  });

  // Create Doctors
  if (preset.doctors && preset.doctors.length > 0) {
    for (const docData of preset.doctors) {
      await Doctor.create({
        ...docData,
        businessId: business._id
      });
    }
  }

  // Return populated business
  return await Business.findById(business._id).populate('assignedGraduateId', 'name phone email');
}

module.exports = {
  CLINIC_PRESETS,
  ensureClinicExists
};
