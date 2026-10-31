import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getDoctorProfileApi, 
  updateDoctorSlotsApi, 
  getDoctorAppointmentsApi, 
  acceptDoctorAppointmentApi, 
  updateDoctorAppointmentStatusApi 
} from '../services/api';
import {
  Stethoscope,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Building2,
  User,
  Phone,
  Sparkles,
  Check,
  X,
  Play,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  BellRing,
  HelpCircle,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendingAcceptanceCount: 0,
    confirmedCount: 0,
    inConsultationCount: 0,
    completedCount: 0
  });

  // Slot Management State
  const [activeSlots, setActiveSlots] = useState([]);
  const [newSlotInput, setNewSlotInput] = useState('');
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [doctorNotesMap, setDoctorNotesMap] = useState({});

  // Active Tab: 'queue' | 'slots' | 'history'
  const [activeTab, setActiveTab] = useState('queue');

  // Load initial doctor profile and appointments
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [profData, apptsData] = await Promise.all([
        getDoctorProfileApi(),
        getDoctorAppointmentsApi()
      ]);

      if (profData?.doctor) {
        setProfile(profData.doctor);
        setClinic(profData.clinic);
        setActiveSlots(profData.doctor.timeSlots || []);
        setIsOnDuty(Boolean(profData.doctor.isOnDuty));
        setDelayMinutes(profData.doctor.delayMinutes || 0);
      }

      if (apptsData?.appointments) {
        setAppointments(apptsData.appointments);
        setMetrics(apptsData.metrics || metrics);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-poll appointments every 6 seconds so incoming customer QR bookings update live
    const interval = setInterval(async () => {
      try {
        const apptsData = await getDoctorAppointmentsApi();
        if (apptsData?.appointments) {
          setAppointments(apptsData.appointments);
          setMetrics(apptsData.metrics || metrics);
        }
      } catch (e) {}
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Handle slot addition
  const handleAddSlot = (e) => {
    e.preventDefault();
    const trimmed = newSlotInput.trim().toUpperCase();
    if (!trimmed) return;

    if (activeSlots.includes(trimmed)) {
      showToast(`Slot "${trimmed}" already exists in your schedule.`);
      return;
    }

    const updated = [...activeSlots, trimmed].sort();
    setActiveSlots(updated);
    setNewSlotInput('');
    showToast(`Added slot "${trimmed}". Remember to click "Save Schedule".`);
  };

  // Handle slot removal
  const handleRemoveSlot = (slotToRemove) => {
    const updated = activeSlots.filter(s => s !== slotToRemove);
    setActiveSlots(updated);
    showToast(`Removed slot "${slotToRemove}". Click "Save Schedule" to sync.`);
  };

  // Quick Preset Handlers
  const applyPreset = (type) => {
    let slots = [];
    if (type === 'morning') {
      slots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'];
    } else if (type === 'evening') {
      slots = ['04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];
    } else if (type === 'fullday') {
      slots = [
        '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
        '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
      ];
    }
    setActiveSlots(slots);
    showToast(`Applied ${type} shift preset with ${slots.length} slots. Save to sync.`);
  };

  // Save Slots and Duty Status to MongoDB
  const handleSaveSlots = async () => {
    setIsSavingSlots(true);
    try {
      await updateDoctorSlotsApi({
        timeSlots: activeSlots,
        isOnDuty,
        delayMinutes
      });
      showToast('✓ Your time slots have been updated and are live for customers!');
      fetchData();
    } catch (err) {
      alert('Error updating time slots: ' + (err.message || 'Please try again'));
    } finally {
      setIsSavingSlots(false);
    }
  };

  // Handle Accept Appointment
  const handleAcceptAppointment = async (id, patientName, slot) => {
    try {
      const notes = doctorNotesMap[id] || '';
      await acceptDoctorAppointmentApi(id, { doctorNotes: notes });
      showToast(`✓ Accepted appointment for ${patientName} at ${slot}`);
      fetchData();
    } catch (err) {
      alert('Failed to accept appointment: ' + (err.message || 'Error'));
    }
  };

  // Handle Status Update (in_consultation, completed)
  const handleUpdateStatus = async (id, status, patientName) => {
    try {
      const notes = doctorNotesMap[id] || '';
      await updateDoctorAppointmentStatusApi(id, { status, doctorNotes: notes });
      showToast(`✓ Appointment for ${patientName} updated to "${status.replace('_', ' ')}"`);
      fetchData();
    } catch (err) {
      alert('Failed to update status: ' + (err.message || 'Error'));
    }
  };

  // Filter appointments
  const pendingAppointments = appointments.filter(
    a => a.status === 'pending_doctor_acceptance' || (!a.doctorAccepted && a.status !== 'cancelled' && a.status !== 'completed')
  );
  const confirmedAppointments = appointments.filter(
    a => a.status === 'confirmed' || a.status === 'checked_in' || a.status === 'in_consultation'
  );
  const completedAppointments = appointments.filter(
    a => a.status === 'completed' || a.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 1. HEADER & DOCTOR PROFILE ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Clinic Brand & Doctor Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-teal-200">
              <Stethoscope className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 leading-tight">
                  {profile?.name || user?.name || 'Dr. Specialist'}
                </span>
                <span className="text-[10px] font-extrabold tracking-wider uppercase bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                  DOCTOR COCKPIT
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{profile?.speciality || 'Consultant Specialist'}</span>
                <span>•</span>
                <span className="text-slate-700 font-semibold">{clinic?.name || 'Sanjeevani Clinic'}</span>
                <span>•</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[11px]">
                  {profile?.room || 'Cabin 1'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Duty Status Switch */}
            <button
              onClick={() => {
                const nextDuty = !isOnDuty;
                setIsOnDuty(nextDuty);
                updateDoctorSlotsApi({ isOnDuty: nextDuty, timeSlots: activeSlots });
                showToast(`You are now marked ${nextDuty ? 'ON DUTY' : 'OFF DUTY'}.`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isOnDuty
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span>{isOnDuty ? 'On Duty (Accepting Slots)' : 'Off Duty'}</span>
            </button>

            {/* Delay Broadcast Dropdown */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Delay:</span>
              <select
                value={delayMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDelayMinutes(val);
                  updateDoctorSlotsApi({ delayMinutes: val, timeSlots: activeSlots, isOnDuty });
                  showToast(val === 0 ? 'Marked running on time.' : `Broadcasted delay of +${val} mins.`);
                }}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value={0}>On Time</option>
                <option value={10}>+10 mins</option>
                <option value={20}>+20 mins</option>
                <option value={30}>+30 mins</option>
                <option value={45}>+45 mins</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            </button>

            {/* Return to Home / Sign Out */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
              title="Sign Out of Doctor Cockpit"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. MAIN CONTAINER ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Pending Doctor Acceptance */}
          <div className={`p-4 rounded-2xl border transition-all ${
            pendingAppointments.length > 0
              ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-2 ring-amber-200/50'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Pending Acceptance</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-amber-900 mt-2">
              {pendingAppointments.length}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              {pendingAppointments.length > 0 ? 'Requires your acceptance to confirm' : 'All slot requests reviewed'}
            </p>
          </div>

          {/* Card 2: Confirmed OPD Patients Today */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-teal-700">
              <span>Confirmed Patients</span>
              <UserCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {confirmedAppointments.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Ready for consultation
            </p>
          </div>

          {/* Card 3: Active Time Slots */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>Configured Slots</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {activeSlots.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Visible on Customer QR scan
            </p>
          </div>

          {/* Card 4: Consultations Completed */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Completed Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {completedAppointments.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Discharged or treated
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Live OPD Queue</span>
            {pendingAppointments.length > 0 && (
              <span className="bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {pendingAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'slots'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Decide My Time Slots ({activeSlots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Completed Consultations ({completedAppointments.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: LIVE OPD QUEUE & ACCEPTANCE ================= */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* 1. SECTION: Awaiting Doctor's Acceptance (Prominent Alert) */}
            <div className="bg-white rounded-3xl border border-amber-200/90 shadow-sm overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-amber-50/80 via-white to-white border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                    !
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Incoming Customer Bookings Awaiting Your Acceptance
                    </h3>
                    <p className="text-xs text-slate-500">
                      Slots requested by patients via QR code will only confirm after your explicit clinical acceptance.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                  {pendingAppointments.length} Action Needed
                </span>
              </div>

              {pendingAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">No Pending Slot Requests</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">When patients scan the clinic QR standee and choose your slot, they will appear here in real-time.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingAppointments.map((appt) => (
                    <div key={appt._id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Patient & Slot Details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                            {appt.tokenNo}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {appt.patientName}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            ({appt.age ? `${appt.age} yrs` : 'Age N/A'}, {appt.gender}, {appt.bloodGroup || 'Blood N/A'})
                          </span>
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                            Requested: {appt.timeSlot}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3.5 h-3.5" /> {appt.patientPhone}
                          </span>
                          <span>•</span>
                          <span className="text-slate-800 font-medium">
                            Complaint: <span className="font-normal italic">"{appt.symptoms || 'General Checkup'}"</span>
                          </span>
                        </div>

                        {/* Optional Doctor Note input before accepting */}
                        <div className="pt-1 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add brief doctor note or preparation advice (optional)..."
                            value={doctorNotesMap[appt._id] || ''}
                            onChange={(e) => setDoctorNotesMap({ ...doctorNotesMap, [appt._id]: e.target.value })}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Acceptance Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptAppointment(appt._id, appt.patientName, appt.timeSlot)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Accept &amp; Confirm Slot</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'cancelled', appt.patientName)}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. SECTION: Today's Confirmed OPD Queue */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Today's Confirmed Patient Queue ({confirmedAppointments.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Appointments accepted by you and ready for consultation in {profile?.room || 'Cabin 1'}.
                  </p>
                </div>
                <div className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  OPD Live
                </div>
              </div>

              {confirmedAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Confirmed Patients in Queue</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Accept incoming requests above to add them to your active OPD queue.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {confirmedAppointments.map((appt) => {
                    const isInConsultation = appt.status === 'in_consultation';

                    return (
                      <div key={appt._id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        isInConsultation ? 'bg-teal-50/50 border-l-4 border-teal-600' : 'hover:bg-slate-50/50'
                      }`}>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-teal-700 text-white">
                              {appt.tokenNo}
                            </span>
                            <span className="font-bold text-sm text-slate-900">
                              {appt.patientName}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-indigo-700 bg-indigo-50 border-indigo-200">
                              {appt.timeSlot}
                            </span>
                            {isInConsultation && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                In Consultation
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600">
                            <span>Phone: {appt.patientPhone}</span>
                            <span className="mx-2">•</span>
                            <span>Symptoms: <em>{appt.symptoms}</em></span>
                          </div>
                          {appt.doctorNotes && (
                            <div className="text-[11px] text-teal-800 bg-teal-50 p-1.5 rounded border border-teal-100 max-w-md">
                              <strong>Doctor Note:</strong> {appt.doctorNotes}
                            </div>
                          )}
                        </div>

                        {/* Consultation Controls */}
                        <div className="flex items-center gap-2">
                          {!isInConsultation ? (
                            <button
                              onClick={() => handleUpdateStatus(appt._id, 'in_consultation', appt.patientName)}
                              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Call Patient (Start)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(appt._id, 'completed', appt.patientName)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Finish Consultation</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DECIDE MY TIME SLOTS ================= */}
        {activeTab === 'slots' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Decide &amp; Configure Your Time Slots
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  You have full autonomy over your schedule. Only the time slots you activate here will be displayed to patients booking via the QR portal.
                </p>
              </div>

              {/* Save Slots Action */}
              <button
                onClick={handleSaveSlots}
                disabled={isSavingSlots}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingSlots ? 'Saving to Database...' : 'Save & Sync Schedule'}</span>
              </button>
            </div>

            {/* Quick Shift Presets Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick Shift Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('morning')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                >
                  ☀️ Morning Shift (9:00 AM - 1:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('evening')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                >
                  🌙 Evening Shift (4:30 PM - 8:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('fullday')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                >
                  ⚡ Full Day OPD (Dual Shifts)
                </button>
              </div>
            </div>

            {/* Add Custom Slot Input Form */}
            <form onSubmit={handleAddSlot} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Add custom slot, e.g. '02:30 PM' or '04:15 PM'"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                className="flex-1 max-w-sm text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Time Slot</span>
              </button>
            </form>

            {/* Active Configured Slots Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  Currently Active Slots ({activeSlots.length}):
                </span>
                <span className="text-[11px] text-slate-400">Click the X to remove a slot</span>
              </div>

              {activeSlots.length === 0 ? (
                <div className="p-8 text-center text-rose-500 bg-rose-50 border border-rose-200 rounded-2xl text-xs">
                  ⚠️ No time slots currently configured. Customers won't be able to book until you add slots.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {activeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="flex items-center justify-between px-3 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-bold text-xs shadow-2xs group"
                    >
                      <span className="font-mono">{slot}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot)}
                        className="text-teal-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                        title={`Remove ${slot}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CONSULTATION HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              Completed Consultations Today ({completedAppointments.length})
            </h3>

            {completedAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No consultations marked completed yet today.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {completedAppointments.map((appt) => (
                  <div key={appt._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black font-mono text-slate-600 mr-2">{appt.tokenNo}</span>
                      <span className="font-bold text-slate-900">{appt.patientName}</span>
                      <span className="text-slate-400 ml-2">({appt.timeSlot})</span>
                      {appt.doctorNotes && (
                        <p className="text-slate-500 italic mt-0.5">Summary: {appt.doctorNotes}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Completed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
