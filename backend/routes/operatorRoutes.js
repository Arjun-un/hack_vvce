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

// GET: Operator metrics
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      ...stats,
      pendingTasks: tasks.filter(t => t.status === 'pending').length
    }
  });
});

// GET: Assigned clinics
router.get('/clinics', (req, res) => {
  res.json({
    success: true,
    data: clinics
  });
});

// GET: Tasks queue
router.get('/tasks', (req, res) => {
  const { status } = req.query;
  const filtered = status ? tasks.filter(t => t.status === status) : tasks;
  res.json({
    success: true,
    data: filtered
  });
});

// POST: Resolve a task
router.post('/tasks/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { actionTaken, operatorNotes } = req.body;

  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks[taskIndex].status = 'resolved';
  tasks[taskIndex].actionTaken = actionTaken || 'Resolved by Operator';
  tasks[taskIndex].operatorNotes = operatorNotes || '';
  tasks[taskIndex].resolvedAt = new Date().toISOString();

  stats.completedThisMonth += 1;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  res.json({
    success: true,
    message: 'Task successfully resolved',
    data: tasks[taskIndex],
    pendingTasksCount: pendingCount
  });
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

