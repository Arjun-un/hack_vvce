const express = require('express');
const router = express.Router();

// Mock store for persistent in-memory demo changes
let stats = {
  assignedBusinesses: 4,
  pendingTasks: 4,
  completedThisMonth: 126,
  estimatedEarnings: 12500,
  nextPayout: 'Nov 5, 2026'
};

let clinics = [
  {
    id: 'c0',
    name: 'Sanjeevani Clinic',
    slug: 'sanjeevani-clinic',
    category: 'Multi-Speciality OPD & Emergency Care',
    address: '14th Cross, Ashok Nagar, Mysuru, Karnataka',
    status: 'Active & Synced',
    pendingEnquiries: 1,
    bookingsToday: 16,
    workflowHealth: 100,
    doctorsCount: 3,
    phone: '+91 98450 12345'
  },
  {
    id: 'c1',
    name: 'GreenLife Clinic',
    slug: 'greenlife-clinic',
    category: 'Multi-Speciality & Dentistry',
    address: '14th Cross, Indiranagar, Bengaluru',
    status: 'Active & Synced',
    pendingEnquiries: 3,
    bookingsToday: 14,
    workflowHealth: 100,
    doctorsCount: 4,
    phone: '+91 98450 12345'
  },
  {
    id: 'c2',
    name: 'CityCare Medical Centre',
    slug: 'citycare-medical',
    category: 'Family Medicine & Diagnostics',
    address: 'Brigade Road, Bengaluru',
    status: 'Active & Synced',
    pendingEnquiries: 2,
    bookingsToday: 18,
    workflowHealth: 98,
    doctorsCount: 6,
    phone: '+91 98450 67890'
  },
  {
    id: 'c3',
    name: 'Sunrise Family Clinic',
    slug: 'sunrise-family',
    category: 'Pediatrics & General Care',
    address: 'Koramangala 4th Block, Bengaluru',
    status: 'Active & Synced',
    pendingEnquiries: 1,
    bookingsToday: 9,
    workflowHealth: 95,
    doctorsCount: 3,
    phone: '+91 98450 11223'
  },
  {
    id: 'c4',
    name: 'PrimeCare Health',
    slug: 'primecare-health',
    category: 'Orthopedics & Physiotherapy',
    address: 'JP Nagar 2nd Phase, Bengaluru',
    status: 'Active & Synced',
    pendingEnquiries: 0,
    bookingsToday: 12,
    workflowHealth: 100,
    doctorsCount: 5,
    phone: '+91 98450 44556'
  }
];

let tasks = [
  {
    id: 'task-1',
    title: 'Booking Conflict Overlap',
    clinicId: 'c1',
    clinicName: 'GreenLife Clinic',
    priority: 'Urgent',
    category: 'conflict',
    timeElapsed: '4m ago',
    customerName: 'Rahul Verma',
    customerPhone: '+91 98860 55432',
    customerMessage: 'Need urgent dental appointment tomorrow morning at 10:30 AM with Dr. Ramesh for severe tooth ache.',
    aiFlag: 'Requested 10:30 AM conflicts with existing booking for Dr. Ramesh.',
    aiIntent: 'BOOKING_REQUEST',
    confidence: '62%',
    suggestedActions: ['Assign 11:00 AM Slot', 'Forward to Doctor', 'Send Clarification WhatsApp'],
    status: 'pending'
  },
  {
    id: 'task-2',
    title: 'Uncertain Enquiry Intent',
    clinicId: 'c2',
    clinicName: 'CityCare Medical Centre',
    priority: 'High',
    category: 'uncertain_ai',
    timeElapsed: '12m ago',
    customerName: 'Sneha Patel',
    customerPhone: '+91 98765 88990',
    customerMessage: 'Do you treat skin rashes and what are the fees? Also does doctor visit home?',
    aiFlag: 'Message contains multiple disjoint inquiries without requested date or specific clinic doctor.',
    aiIntent: 'GENERAL_ENQUIRY',
    confidence: '58%',
    suggestedActions: ['Reply ₹500 Fee & No Home Visit', 'Request Phone Callback', 'Forward to Dermatologist'],
    status: 'pending'
  },
  {
    id: 'task-3',
    title: 'WhatsApp Reminder Failed',
    clinicId: 'c3',
    clinicName: 'Sunrise Family Clinic',
    priority: 'High',
    category: 'workflow_error',
    timeElapsed: '28m ago',
    customerName: 'Ananya Roy',
    customerPhone: '9845123987',
    customerMessage: 'Automated 24h reminder for pediatric checkup failed delivery.',
    aiFlag: 'Template payload missing international country code prefix +91.',
    aiIntent: 'SYSTEM_ERROR',
    confidence: '99%',
    suggestedActions: ['Auto-prefix +91 & Resend', 'Call Patient Directly', 'Dismiss Notification'],
    status: 'pending'
  },
  {
    id: 'task-4',
    title: 'Operating Hours Change',
    clinicId: 'c4',
    clinicName: 'PrimeCare Health',
    priority: 'Medium',
    category: 'manual_request',
    timeElapsed: '1h ago',
    customerName: 'Dr. Suresh (Owner)',
    customerPhone: '+91 98450 44556',
    customerMessage: 'Please close evening OPD this Friday from 6 PM due to clinic maintenance.',
    aiFlag: 'Manual update request from verified clinic owner.',
    aiIntent: 'CONFIG_UPDATE',
    confidence: '95%',
    suggestedActions: ['Block Friday 6-8 PM Slots', 'Notify 3 Booked Patients', 'Acknowledge Owner'],
    status: 'pending'
  }
];

require('../models/User');
require('../models/Business');
require('../models/Doctor');
const Appointment = require('../models/Appointment');
const GraduateTask = require('../models/GraduateTask');

// GET: Operator metrics
router.get('/stats', async (req, res) => {
  try {
    const dbPendingCount = await GraduateTask.countDocuments({ status: 'pending' });
    const mockPendingCount = tasks.filter(t => t.status === 'pending').length;
    const dbResolvedCount = await GraduateTask.countDocuments({ status: 'resolved' });

    res.json({
      success: true,
      publicUrl: req.app.locals.publicUrl || '',
      data: {
        ...stats,
        pendingTasks: dbPendingCount + mockPendingCount,
        completedThisMonth: stats.completedThisMonth + dbResolvedCount
      }
    });
  } catch (err) {
    res.json({
      success: true,
      publicUrl: req.app.locals.publicUrl || '',
      data: {
        ...stats,
        pendingTasks: tasks.filter(t => t.status === 'pending').length
      }
    });
  }
});

// GET: Assigned clinics
router.get('/clinics', (req, res) => {
  res.json({
    success: true,
    publicUrl: req.app.locals.publicUrl || '',
    data: clinics
  });
});

// Helper: Format relative elapsed time
function formatRelativeTime(date) {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// GET: Tasks queue (Live MongoDB sync + In-memory store)
router.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;

    // 1. Fetch real MongoDB tasks
    const query = status ? { status } : {};
    const mongoTasks = await GraduateTask.find(query)
      .populate('appointmentId')
      .populate('businessId')
      .sort({ createdAt: -1 });

    const formattedDbTasks = mongoTasks.map(t => {
      const apt = t.appointmentId;
      const biz = t.businessId;
      const isAutoApproved = t.type === 'ai_auto_approved';

      return {
        id: t._id.toString(),
        _id: t._id.toString(),
        appointmentId: apt ? apt._id.toString() : null,
        title: isAutoApproved 
          ? `⚡ AI Auto-Approved: Token ${apt?.tokenNo || 'T-AUTO'}` 
          : (t.type === 'slot_conflict' ? `Slot Conflict: Token ${apt?.tokenNo || 'T-AUTO'}` : 'Exception Review'),
        clinicName: biz?.name || 'Sanjeevani Clinic',
        clinicSlug: biz?.slug || 'sanjeevani-clinic',
        priority: t.priority === 'high' ? 'Urgent' : (isAutoApproved ? 'Low' : 'Medium'),
        timeElapsed: formatRelativeTime(t.createdAt),
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        customerMessage: apt 
          ? `Chief Complaint: "${apt.symptoms}". Requested slot: ${apt.timeSlot} with ${apt.doctorName}.`
          : t.details,
        aiFlag: isAutoApproved 
          ? 'AI checked slot availability, doctor duty status & clinic hours: 0 conflicts detected. Auto-routed to clinic queue.'
          : t.details,
        aiIntent: isAutoApproved ? 'AI_AUTO_COMPLETED' : 'BOOKING_CONFLICT',
        confidence: isAutoApproved ? '99%' : '72%',
        suggestedActions: isAutoApproved 
          ? ['Auto-Approved by Gemini AI', 'No Intervention Needed']
          : [
              'Shift to Next Available Slot (11:15 AM)',
              'Confirm Overwrite & Fit In Slot',
              'Reassign to Duty Doctor',
              'Send Custom Note to Patient'
            ],
        status: t.status,
        actionTaken: t.resolutionNote || '',
        operatorNotes: t.resolutionNote || '',
        timeSlot: apt?.timeSlot || '',
        doctorName: apt?.doctorName || '',
        tokenNo: apt?.tokenNo || '',
        type: t.type
      };
    });

    // 2. Fetch mock tasks
    const filteredMockTasks = status ? tasks.filter(t => t.status === status) : tasks;

    // Merge: MongoDB tasks first (most relevant real-time actions)
    const combinedTasks = [...formattedDbTasks, ...filteredMockTasks];

    res.json({
      success: true,
      data: combinedTasks
    });
  } catch (err) {
    console.error('Failed to load DB tasks:', err);
    const filtered = status ? tasks.filter(t => t.status === status) : tasks;
    res.json({
      success: true,
      data: filtered
    });
  }
});

// POST: Resolve a task (Updates both GraduateTask and MongoDB Appointment)
router.post('/tasks/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken, operatorNotes, updatedTimeSlot, updatedDoctorId } = req.body;
    const resolutionText = operatorNotes || actionTaken || 'Resolved by Graduate Operator';

    let resolvedAppointment = null;
    let resolvedTask = null;

    // Check if ID is a valid MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isMongoId) {
      // 1. Try finding in GraduateTask
      const dbTask = await GraduateTask.findById(id);
      if (dbTask) {
        dbTask.status = 'resolved';
        dbTask.resolutionNote = resolutionText;
        dbTask.resolvedAt = new Date();
        await dbTask.save();
        resolvedTask = dbTask;

        if (dbTask.appointmentId) {
          const updateData = {
            status: 'confirmed',
            graduateResolutionNotes: resolutionText,
            conflictReason: ''
          };
          if (updatedTimeSlot) updateData.timeSlot = updatedTimeSlot;
          if (updatedDoctorId) {
            const doc = await Doctor.findById(updatedDoctorId);
            if (doc) {
              updateData.doctorId = doc._id;
              updateData.doctorName = doc.name;
            }
          }
          resolvedAppointment = await Appointment.findByIdAndUpdate(
            dbTask.appointmentId,
            updateData,
            { returnDocument: 'after' }
          );
        }
      } else {
        // 2. Try finding directly in Appointment
        const directApt = await Appointment.findById(id);
        if (directApt) {
          const updateData = {
            status: 'confirmed',
            graduateResolutionNotes: resolutionText,
            conflictReason: ''
          };
          if (updatedTimeSlot) updateData.timeSlot = updatedTimeSlot;
          resolvedAppointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: 'after' }
          );

          // Also mark linked GraduateTask if any
          await GraduateTask.updateMany(
            { appointmentId: id },
            { status: 'resolved', resolutionNote: resolutionText, resolvedAt: new Date() }
          );
        }
      }
    }

    // 3. Update in-memory tasks array if it matches
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      tasks[taskIndex].status = 'resolved';
      tasks[taskIndex].actionTaken = actionTaken || 'Resolved by Operator';
      tasks[taskIndex].operatorNotes = resolutionText;
      tasks[taskIndex].resolvedAt = new Date().toISOString();
      resolvedTask = tasks[taskIndex];
    }

    stats.completedThisMonth += 1;
    const dbPending = await GraduateTask.countDocuments({ status: 'pending' }).catch(() => 0);
    const mockPending = tasks.filter(t => t.status === 'pending').length;

    res.json({
      success: true,
      message: 'Task successfully resolved and client appointment updated in real-time.',
      appointment: resolvedAppointment,
      data: resolvedTask || { id, status: 'resolved', resolutionNote: resolutionText },
      pendingTasksCount: dbPending + mockPending
    });
  } catch (err) {
    console.error('Error resolving task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Add manual task
router.post('/tasks', (req, res) => {
  const { title, clinicName, priority, customerName, customerMessage } = req.body;
  const newTask = {
    id: `task-${Date.now()}`,
    title: title || 'Manual Operator Task',
    clinicId: 'c1',
    clinicName: clinicName || 'GreenLife Clinic',
    priority: priority || 'Medium',
    category: 'manual_task',
    timeElapsed: 'Just now',
    customerName: customerName || 'Direct Enquiry',
    customerPhone: '+91 98000 00000',
    customerMessage: customerMessage || 'Operator created manual task',
    aiFlag: 'Direct manual escalation created by operator.',
    aiIntent: 'MANUAL_INTERVENTION',
    confidence: '100%',
    suggestedActions: ['Contact Customer', 'Update Schedule', 'Mark Done'],
    status: 'pending'
  };

  tasks.unshift(newTask);
  res.status(201).json({
    success: true,
    data: newTask,
    pendingTasksCount: tasks.filter(t => t.status === 'pending').length
  });
});

module.exports = router;

