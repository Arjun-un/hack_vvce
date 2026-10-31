import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Activity,
  Bot,
  Bell,
  Search,
  ExternalLink,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  QrCode,
  Check,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  CheckSquare,
  X,
  Copy,
  Calendar,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QrStandeeModal from './clinic/QrStandeeModal';
import { useAuth } from '../context/AuthContext';

export default function GraduateWorkspace() {
  const { user, logout } = useAuth();
  // State
  const [activeNav, setActiveNav] = useState('Overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [chosenSlot, setChosenSlot] = useState('original');
  const [activeTabFilter, setActiveTabFilter] = useState('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrClinic, setQrClinic] = useState(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClinic, setNewTaskClinic] = useState('Sanjeevani Clinic');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [copiedLink, setCopiedLink] = useState(false);

  // Operational metrics
  const [stats, setStats] = useState({
    assignedBusinesses: 4,
    pendingTasks: 4,
    completedThisMonth: 126,
    estimatedEarnings: 12500,
  });

  // Assigned Clinics
  const [clinics, setClinics] = useState([
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
      phone: '+91 98450 44556'
    }
  ]);

  // Tasks Queue
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Booking Conflict Overlap',
      clinicName: 'GreenLife Clinic',
      clinicSlug: 'greenlife-clinic',
      priority: 'Urgent',
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
      clinicName: 'CityCare Medical Centre',
      clinicSlug: 'citycare-medical',
      priority: 'High',
      timeElapsed: '12m ago',
      customerName: 'Sneha Patel',
      customerPhone: '+91 98765 88990',
      customerMessage: 'Do you treat skin rashes and what are the fees? Also does doctor visit home?',
      aiFlag: 'Message contains vague symptom inquiry without date or preferred doctor.',
      aiIntent: 'GENERAL_ENQUIRY',
      confidence: '58%',
      suggestedActions: ['Reply ₹500 Fee & No Home Visit', 'Request Phone Callback', 'Forward to Dermatologist'],
      status: 'pending'
    },
    {
      id: 'task-3',
      title: 'WhatsApp Reminder Failed',
      clinicName: 'Sunrise Family Clinic',
      clinicSlug: 'sunrise-family',
      priority: 'High',
      timeElapsed: '28m ago',
      customerName: 'Ananya Roy',
      customerPhone: '9845123987',
      customerMessage: 'Automated 24h reminder for pediatric checkup failed delivery.',
      aiFlag: 'Template payload missing phone country code prefix (+91).',
      aiIntent: 'SYSTEM_ERROR',
      confidence: '99%',
      suggestedActions: ['Auto-prefix +91 & Resend', 'Call Patient Directly', 'Dismiss Notification'],
      status: 'pending'
    },
    {
      id: 'task-4',
      title: 'Operating Hours Change',
      clinicName: 'PrimeCare Health',
      clinicSlug: 'primecare-health',
      priority: 'Medium',
      timeElapsed: '1h ago',
      customerName: 'Dr. Suresh (Owner)',
      customerPhone: '+91 98450 44556',
      customerMessage: 'Please close evening OPD this Friday from 6 PM due to clinic maintenance.',
      aiFlag: 'Manual update request from clinic owner.',
      aiIntent: 'CONFIG_UPDATE',
      confidence: '95%',
      suggestedActions: ['Block Friday 6-8 PM Slots', 'Notify 3 Booked Patients', 'Acknowledge Owner'],
      status: 'pending'
    }
  ]);

  // Set default selected task
  useEffect(() => {
    if (tasks.length > 0 && !selectedTask) {
      const firstPending = tasks.find(t => t.status === 'pending');
      if (firstPending) {
        setSelectedTask(firstPending);
        setSelectedAction(firstPending.suggestedActions[0] || '');
      }
    }
  }, [tasks]);

  // Try fetching live data from backend if available
  useEffect(() => {
    const apiBase = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
      ? window.location.origin
      : 'http://localhost:5000';

    // Sync live clinic dashboard to get ngrok publicUrl and active state
    fetch(`${apiBase}/api/clinic/sanjeevani-clinic/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data.publicUrl) setPublicUrl(data.publicUrl);
        if (data.business) {
          setClinics(prev => {
            const hasSanjeevani = prev.some(c => c.slug === 'sanjeevani-clinic');
            if (hasSanjeevani) {
              return prev.map(c => c.slug === 'sanjeevani-clinic' ? {
                ...c,
                name: data.business.name,
                address: data.business.address,
                pendingEnquiries: data.aiInquiries?.length || c.pendingEnquiries,
                bookingsToday: data.appointments?.length || c.bookingsToday
              } : c);
            }
            return prev;
          });
        }
      })
      .catch(() => {});

    fetch(`${apiBase}/api/operator/stats`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setStats(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {
        // Fallback to local state seamlessly
      });

    fetch(`${apiBase}/api/operator/tasks`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.length > 0) {
          setTasks(res.data);
          const first = res.data.find(t => t.status === 'pending');
          if (first) {
            setSelectedTask(first);
            setSelectedAction(first.suggestedActions?.[0] || '');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Handle task selection
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setSelectedAction(task.suggestedActions?.[0] || '');
    setOperatorNotes(task.actionTaken || task.operatorNotes || '');
    setChosenSlot(task.timeSlot || 'original');
  };

  // Handle Mark Resolved
  const handleResolveTask = async () => {
    if (!selectedTask) return;

    const apiBase = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
      ? window.location.origin
      : 'http://localhost:5000';

    const resolutionSummary = operatorNotes.trim() || selectedAction || 'Verified and approved by OpsLoop Graduate Specialist.';
    const targetSlot = (chosenSlot && chosenSlot !== 'original') ? chosenSlot : selectedTask.timeSlot;

    try {
      await fetch(`${apiBase}/api/operator/tasks/${selectedTask.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionTaken: selectedAction,
          operatorNotes: resolutionSummary,
          updatedTimeSlot: targetSlot
        })
      });
    } catch (err) {
      console.error('Resolve task network error:', err);
    }

    // Update local state immediately
    const updatedTasks = tasks.map(t =>
      t.id === selectedTask.id ? { 
        ...t, 
        status: 'resolved',
        actionTaken: selectedAction,
        operatorNotes: resolutionSummary,
        timeSlot: targetSlot || t.timeSlot
      } : t
    );
    setTasks(updatedTasks);

    const newPendingCount = updatedTasks.filter(t => t.status === 'pending').length;
    setStats(prev => ({
      ...prev,
      pendingTasks: newPendingCount,
      completedThisMonth: prev.completedThisMonth + 1
    }));

    // Select next pending task
    const nextPending = updatedTasks.find(t => t.status === 'pending');
    setSelectedTask(nextPending || null);
    setSelectedAction(nextPending?.suggestedActions?.[0] || '');
    setOperatorNotes('');
    setChosenSlot('original');

    // Trigger toast
    showToast(`✓ Resolved & Customer QR screen updated: "${selectedTask.title}"`);
  };

  // Toast helper
  const showToast = (msg) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(''), 3500);
  };

  // Sync Workflows action
  const handleSyncWorkflows = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('✓ All 4 clinic workflows synchronized successfully with Gemini Automation Engine');
    }, 900);
  };

  // Add Manual Task
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      clinicName: newTaskClinic,
      clinicSlug: newTaskClinic.toLowerCase().replace(/\s+/g, '-'),
      priority: newTaskPriority,
      timeElapsed: 'Just now',
      customerName: 'Direct Walk-in / Phone',
      customerPhone: '+91 98000 00000',
      customerMessage: 'Manual task entered directly by operator Aarav.',
      aiFlag: 'Operator manual triage item.',
      aiIntent: 'MANUAL_INTERVENTION',
      confidence: '100%',
      suggestedActions: ['Call Patient', 'Reschedule Slot', 'Mark Done'],
      status: 'pending'
    };

    setTasks([newTask, ...tasks]);
    setStats(prev => ({ ...prev, pendingTasks: prev.pendingTasks + 1 }));
    setSelectedTask(newTask);
    setShowAddTaskModal(false);
    setNewTaskTitle('');
    showToast('✓ Manual task added to queue');
  };

  // Open QR modal
  const handleOpenQR = (clinic) => {
    setQrClinic(clinic);
    setShowQRModal(true);
  };

  // Copy QR URL
  const qrUrl = qrClinic ? `${window.location.origin}/c/${qrClinic.slug}` : '';
  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (activeTabFilter === 'urgent') return t.status === 'pending' && (t.priority === 'Urgent' || t.priority === 'High');
    if (activeTabFilter === 'conflict') return t.status === 'pending' && (t.aiIntent === 'BOOKING_REQUEST' || t.aiIntent === 'BOOKING_CONFLICT' || t.type === 'slot_conflict');
    if (activeTabFilter === 'enquiry') return t.status === 'pending' && t.aiIntent === 'GENERAL_ENQUIRY';
    if (activeTabFilter === 'ai_auto') return t.type === 'ai_auto_approved' || t.aiIntent === 'AI_AUTO_COMPLETED' || t.status === 'resolved';
    return t.status === 'pending';
  }).filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (t.title || '').toLowerCase().includes(q) ||
           (t.clinicName || '').toLowerCase().includes(q) ||
           (t.customerName || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 text-sm animate-fade-in">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* ================= 1. FIXED LEFT SIDEBAR ================= */}
      <aside className="w-64 h-screen fixed left-0 top-0 border-r border-slate-200 bg-white flex flex-col justify-between z-30 select-none">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <Link to="/" title="Back to OpsLoop Home" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">OpsLoop</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded">
                Operator
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspace
            </div>

            <button
              onClick={() => setActiveNav('Overview')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeNav === 'Overview'
                  ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav('My Businesses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeNav === 'My Businesses'
                  ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>My Businesses</span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {stats.assignedBusinesses}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('Task Queue')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeNav === 'Task Queue'
                  ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Task Queue</span>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                {stats.pendingTasks}
              </span>
            </button>

            <div className="pt-3 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Automation & Tools
            </div>

            <button
              onClick={() => handleOpenQR(clinics[0])}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-indigo-500" />
                <span>Reception QR Standee</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveNav('Automation Workflows')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeNav === 'Automation Workflows'
                  ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-violet-600" />
                <span>Workflows (Gemini)</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>

            <button
              onClick={() => setActiveNav('Customer Requests')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeNav === 'Customer Requests'
                  ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Customer Requests</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav('Earnings & Payouts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeNav === 'Earnings & Payouts'
                  ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4" />
                <span>Earnings & Payouts</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AS'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{user?.name || 'Aarav Sharma'}</p>
                <p className="text-[11px] text-slate-500 capitalize">{user?.role || 'operator'} • Authorized</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Monthly Earnings</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ₹12,500 (Est.)
            </span>
          </div>
        </div>
      </aside>

      {/* ================= 2. TOP NAVIGATION BAR ================= */}
      <header className="pl-64 h-16 sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200 z-20 flex items-center justify-between px-8">
        {/* Breadcrumb & Live indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <button 
              onClick={() => setActiveNav('Overview')} 
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Workspace
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">{activeNav}</span>
          </div>
          <span className="h-4 w-px bg-slate-200"></span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All 4 Clinics Operational</span>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="relative w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, clinic names, customer IDs... ⌘K"
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* AI Engine Status */}
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 px-3 py-1.5 rounded-md text-xs font-medium">
            <Bot className="w-3.5 h-3.5 text-violet-600" />
            <span>Automation Engine: Online</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>

          {/* User Sign Out */}
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 border border-slate-200 px-2.5 py-1.5 rounded-md bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-pointer text-xs font-medium text-slate-700 transition-colors"
            title="Sign out of Graduate Operator workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ================= 3. MAIN DASHBOARD CONTENT ================= */}
      <main className="pl-64 flex-1">
        <div className="max-w-[1400px] mx-auto p-8 space-y-6">
          {/* A. Header & Welcome Area */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Welcome back, Aarav 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor your assigned clinics, review low-confidence AI predictions, and clear queue exceptions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncWorkflows}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Workflows'}</span>
              </button>

              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Manual Task</span>
              </button>
            </div>
          </div>

          {/* B. Key Metric Cards (Grid of 4) */}
          <div className="grid grid-cols-4 gap-4">
            {/* 1. Assigned Businesses */}
            <div 
              onClick={() => setActiveNav('My Businesses')}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeNav === 'My Businesses' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Assigned Businesses</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.assignedBusinesses}</div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>All active • 0 unassigned</span>
              </p>
            </div>

            {/* 2. Pending Tasks */}
            <div 
              onClick={() => setActiveNav('Task Queue')}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeNav === 'Task Queue' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Pending Tasks</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.pendingTasks}</div>
              <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>2 high priority exceptions</span>
              </p>
            </div>

            {/* 3. Completed This Month */}
            <div 
              onClick={() => setActiveNav('Task Queue')}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeNav === 'Task Queue' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Completed This Month</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.completedThisMonth}</div>
              <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18% from last month</span>
              </p>
            </div>

            {/* 4. Estimated Earnings */}
            <div 
              onClick={() => setActiveNav('Earnings & Payouts')}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeNav === 'Earnings & Payouts' ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-violet-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Estimated Earnings</span>
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">₹{stats.estimatedEarnings.toLocaleString()}</div>
              <p className="text-xs text-slate-400 mt-1.5">
                <span className="font-semibold text-slate-600">Demo Data</span> • Next payout Nov 5
              </p>
            </div>
          </div>

          {/* C. Two-Column Operational Layout */}
          {(activeNav === 'Overview' || activeNav === 'My Businesses' || activeNav === 'Task Queue') && (
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* ================= LEFT COLUMN ================= */}
              <div className={activeNav === 'My Businesses' ? "col-span-12 space-y-6" : "col-span-8 space-y-6"}>
                {/* 1. Section: My Assigned Clinics */}
                {(activeNav === 'Overview' || activeNav === 'My Businesses') && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {activeNav === 'My Businesses' ? 'My Assigned Clinics & Partner Hospitals' : 'My Assigned Clinics'}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {activeNav === 'My Businesses'
                            ? 'Live operational management of all assigned clinics. Click "Workspace ↗" to manage doctor rosters and live queues.'
                            : 'Live operational state and daily automated throughput'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        {clinics.length} Clinics Active
                      </span>
                    </div>

                    <div className={activeNav === 'My Businesses' ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-3.5"}>
                  {clinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="border border-slate-200 hover:border-indigo-300 rounded-lg p-3.5 bg-slate-50/50 hover:bg-white transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to={`/clinic/${clinic.slug}`}
                            className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors hover:underline block"
                            title={`Open ${clinic.name} Workspace`}
                          >
                            {clinic.name}
                          </Link>
                          <p className="text-[11px] text-slate-500">{clinic.category}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          {clinic.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Pending Enq.</p>
                          <p className="text-xs font-bold text-slate-800">{clinic.pendingEnquiries}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Bookings Today</p>
                          <p className="text-xs font-bold text-slate-800">{clinic.bookingsToday}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Health</p>
                          <p className="text-xs font-bold text-emerald-600">{clinic.workflowHealth}%</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleOpenQR(clinic)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shadow-2xs cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>QR Code</span>
                        </button>
                        <Link
                          to={`/clinic/${clinic.slug}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                          title={`Open ${clinic.name} Workspace`}
                        >
                          <span>Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Section: High-Priority Task Queue */}
            {(activeNav === 'Overview' || activeNav === 'Task Queue') && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">High-Priority Task Queue</h2>
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                        {filteredTasks.length} Exceptions
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Exceptions flagged by Gemini AI requiring human operator intervention
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setActiveTabFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeTabFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTabFilter('urgent')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeTabFilter === 'urgent' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Urgent / High
                    </button>
                    <button
                      onClick={() => setActiveTabFilter('conflict')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeTabFilter === 'conflict' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Conflicts
                    </button>
                    <button
                      onClick={() => setActiveTabFilter('enquiry')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeTabFilter === 'enquiry' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Enquiries
                    </button>
                    <button
                      onClick={() => setActiveTabFilter('ai_auto')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeTabFilter === 'ai_auto' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      ⚡ AI Auto-Completed
                    </button>
                  </div>
                </div>

                {/* Task Table / List */}
                <div className="divide-y divide-slate-200">
                  {filteredTasks.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="text-sm font-semibold text-slate-700">All exceptions cleared!</p>
                      <p className="text-xs text-slate-400">All clinic workflows running smoothly with 0 pending errors.</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const isSelected = selectedTask?.id === task.id;
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleSelectTask(task)}
                          className={`p-4 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50/50 border-l-4 border-indigo-600'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Priority badge */}
                              {task.priority === 'Urgent' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                                  Urgent
                                </span>
                              )}
                              {task.priority === 'High' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                  High
                                </span>
                              )}
                              {task.priority === 'Medium' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                                  Medium
                                </span>
                              )}

                              <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                              <span className="text-xs text-slate-400">• {task.clinicName}</span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-1 mb-1 font-normal">
                              {task.aiFlag}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.timeElapsed}
                              </span>
                              <span>Customer: {task.customerName}</span>
                              <span className="text-violet-600 font-semibold bg-violet-50 px-1.5 py-0.5 rounded">
                                Gemini: {task.aiIntent} ({task.confidence})
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTask(task);
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Review & Resolve
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN (35% width = 4 cols) ================= */}
          {(activeNav === 'Overview' || activeNav === 'Task Queue') && (
            <div className="col-span-4 space-y-6">
              {/* 1. Interactive "Quick Task Resolver Slide-over/Panel" */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-bold text-slate-900">Task Inspection & Resolver</h3>
                  </div>
                  {selectedTask && (
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                      Confidence: {selectedTask.confidence}
                    </span>
                  )}
                </div>

                {selectedTask ? (
                  <div className="space-y-4">
                    {/* Clinic and issue */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                        Active Selection
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{selectedTask.title}</h4>
                      <p className="text-xs text-indigo-600 font-medium">{selectedTask.clinicName}</p>
                    </div>

                    {/* Customer Original Message */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1 font-medium">
                        <span>CUSTOMER MESSAGE ({selectedTask.customerName})</span>
                        <span>{selectedTask.customerPhone}</span>
                      </div>
                      <p className="text-slate-800 italic">"{selectedTask.customerMessage}"</p>
                    </div>

                    {/* Gemini AI Extraction Pill */}
                    <div className="bg-violet-50/70 border border-violet-200 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-violet-900 font-semibold text-[11px]">
                        <Bot className="w-3.5 h-3.5 text-violet-600" />
                        <span>Gemini Structured Extraction</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="bg-white text-violet-800 border border-violet-200 font-medium px-2 py-0.5 rounded">
                          Intent: {selectedTask.aiIntent}
                        </span>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 font-medium px-2 py-0.5 rounded">
                          Needs Human Review
                        </span>
                      </div>
                      <p className="text-[11px] text-violet-900/80 leading-relaxed">
                        <span className="font-semibold">Reason:</span> {selectedTask.aiFlag}
                      </p>
                    </div>

                    {/* Suggested Actions */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                        Suggested Actions
                      </span>
                      <div className="space-y-1.5 mt-2">
                        {selectedTask.suggestedActions?.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedAction(action)}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                              selectedAction === action
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{action}</span>
                              {selectedAction === action && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alternate Slot Selector (For Conflicts) */}
                    {selectedTask.timeSlot && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
                          Reassign Time Slot (Updates Patient Pass Live)
                        </label>
                        <select
                          value={chosenSlot}
                          onChange={(e) => setChosenSlot(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-indigo-500"
                        >
                          <option value="original">Keep Original Slot ({selectedTask.timeSlot})</option>
                          <option value="11:15 AM">Shift to 11:15 AM (Next Available Morning)</option>
                          <option value="11:30 AM">Shift to 11:30 AM</option>
                          <option value="11:45 AM">Shift to 11:45 AM</option>
                          <option value="12:00 PM">Shift to 12:00 PM</option>
                          <option value="04:30 PM">Shift to 04:30 PM (Evening OPD)</option>
                          <option value="05:00 PM">Shift to 05:00 PM (Evening OPD)</option>
                          <option value="05:30 PM">Shift to 05:30 PM (Evening OPD)</option>
                        </select>
                      </div>
                    )}

                    {/* Operator Resolution Notes / Message to Patient */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                          Summary to Patient (Shown on Client Screen)
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={operatorNotes}
                        onChange={(e) => setOperatorNotes(e.target.value)}
                        placeholder="e.g. Verified with Dr. Rajesh. Shifted slot to 11:15 AM to eliminate waiting time. Please arrive 10m early."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      />
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[
                          'Shifted to 11:15 AM due to doctor overlap.',
                          'Approved priority pass with Duty Doctor.',
                          'Confirmed slot; clinic ready for check-in.'
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setOperatorNotes(preset)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors"
                          >
                            + {preset.slice(0, 24)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={handleResolveTask}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>⚡ Resolve & Update Client QR Pass</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs">Select any task from the queue to inspect and resolve.</p>
                  </div>
                )}
              </div>

              {/* 2. "Automation Health & AI Performance" Widget */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Automation Health</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Telemetry
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">AI Classification Success Rate</span>
                      <span className="text-slate-900">96.8%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96.8%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 font-medium">Workflows Active</span>
                      <p className="text-sm font-bold text-slate-900">16 Running</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 font-medium">Gemini Latency</span>
                      <p className="text-sm font-bold text-slate-900">1.2s avg</p>
                    </div>
                  </div>

                  {/* Disclaimer banner */}
                  <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <span className="font-semibold">Medical Guardrail:</span> AI suggestions are triage aids for administrative scheduling only. Do not provide medical diagnoses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* D. Automation Workflows View */}
        {activeNav === 'Automation Workflows' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-600" />
                    Gemini 2.0 AI Automation Workflows
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time autonomous triage, intent extraction, slot collision prevention, and human-in-the-loop escalation rules.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Workflow Engine Live
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">1. Instant QR Slot Auto-Approval</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    When patient selects an available doctor slot, AI validates clinic status, checks doctor duty, issues token, and notifies graduate with zero friction.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">2. Collision & Overlap Detector</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Detects double bookings or off-duty slots. Automatically holds patient in coordinating state and dispatches high-priority task to operator queue.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">3. Emergency Escalation Guardrail</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Strict</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Critical symptoms (chest pain, acute breathing distress) trigger instantaneous medical casualty guidance directing patient to nearest emergency hospital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E. Customer Requests View */}
        {activeNav === 'Customer Requests' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Live Customer Requests & QR Scans
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Incoming inquiries, appointments, and triage requests across all assigned clinics.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Live Stream Active
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {tasks.slice(0, 6).map((t, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {t.customerName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{t.customerName}</span>
                          <span className="text-xs text-slate-400">• {t.customerPhone}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{t.clinicName}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{t.customerMessage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        t.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {t.status === 'resolved' ? 'Resolved' : 'Review Required'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">{t.timeElapsed}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* F. Earnings & Payouts View */}
        {activeNav === 'Earnings & Payouts' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-violet-600" />
                    Graduate Operator Earnings & Payouts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct automated payouts for resolving exceptions, managing clinic workflows, and AI supervision.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Direct Deposit Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-indigo-50/50 to-white">
                  <span className="text-xs font-semibold text-indigo-700">Accumulated This Month</span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">₹12,500</div>
                  <p className="text-xs text-slate-500 mt-2">126 automated actions + 4 verified clinics</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <span className="text-xs font-semibold text-slate-600">Next Scheduled Payout</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">Nov 5, 2026</div>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Automatic transfer to HDFC •••• 4412</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <span className="text-xs font-semibold text-slate-600">Average Resolution Fee</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">₹100 / task</div>
                  <p className="text-xs text-slate-500 mt-2">Bonus: ₹50 per verified AI clean triage</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* ================= RECEPTION QR STANDEE MODAL (EXACT SAME AS CLINIC OWNER DASH) ================= */}
      {showQRModal && qrClinic && (
        <QrStandeeModal
          clinic={qrClinic}
          publicUrl={publicUrl}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* ================= ADD MANUAL TASK MODAL ================= */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddTaskModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Manual Task</h3>
                <p className="text-xs text-slate-500">Create an exception item directly in the operator queue</p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Confirm VIP Patient Slot"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic</label>
                  <select
                    value={newTaskClinic}
                    onChange={(e) => setNewTaskClinic(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  >
                    {clinics.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

