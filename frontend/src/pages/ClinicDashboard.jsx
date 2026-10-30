import React, { useState, useEffect } from 'react';
import { initialClinicData } from '../data/mockClinicData';
import { 
  getClinicDashboard, 
  updateClinicStatus, 
  updateEmergencyBroadcast, 
  createWalkInAppointment, 
  updateAppointmentStatus, 
  toggleDoctorDuty, 
  setDoctorDelay 
} from '../services/api';

import ClinicNavbar from '../components/clinic/ClinicNavbar';
import EmergencyAlertBanner from '../components/clinic/EmergencyAlertBanner';
import StatsOverview from '../components/clinic/StatsOverview';
import LiveAppointmentQueue from '../components/clinic/LiveAppointmentQueue';
import DoctorRosterGrid from '../components/clinic/DoctorRosterGrid';
import AiInquiryFeed from '../components/clinic/AiInquiryFeed';
import AssignedGraduateCard from '../components/clinic/AssignedGraduateCard';

import QrStandeeModal from '../components/clinic/QrStandeeModal';
import AddWalkInModal from '../components/clinic/AddWalkInModal';
import EmergencyBroadcastModal from '../components/clinic/EmergencyBroadcastModal';

export default function ClinicDashboard() {
  const [clinic, setClinic] = useState(initialClinicData.business);
  const [doctors, setDoctors] = useState(initialClinicData.doctors);
  const [appointments, setAppointments] = useState(initialClinicData.appointments);
  const [aiInquiries, setAiInquiries] = useState(initialClinicData.aiInquiries);
  const [graduate, setGraduate] = useState(initialClinicData.assignedGraduate);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAddWalkInOpen, setIsAddWalkInOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Fetch initial live data from MongoDB Atlas
  const loadDashboardData = async () => {
    try {
      const data = await getClinicDashboard('sanjeevani-clinic');
      if (data.business) {
        setClinic(data.business);
        if (data.doctors && data.doctors.length > 0) setDoctors(data.doctors);
        if (data.appointments && data.appointments.length > 0) setAppointments(data.appointments);
        if (data.aiInquiries && data.aiInquiries.length > 0) setAiInquiries(data.aiInquiries);
        if (data.assignedGraduate) setGraduate(data.assignedGraduate);
        if (data.publicUrl) setPublicUrl(data.publicUrl);
        setIsDbConnected(true);
      }
    } catch (err) {
      console.warn('Backend API offline or unreachable, using responsive mock state:', err.message);
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Auto-poll every 10 seconds for real-time customer QR bookings
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handler: Change Clinic Operational Status
  const handleClinicStatusChange = async (newStatus) => {
    setClinic(prev => ({ ...prev, currentStatus: newStatus }));
    try {
      await updateClinicStatus(clinic.slug || 'sanjeevani-clinic', newStatus);
    } catch (e) {
      console.error('Failed to sync clinic status:', e);
    }
  };

  // Handler: Update Appointment Status in Queue
  const handleUpdateAppointmentStatus = async (id, newStatus) => {
    setAppointments(prev => prev.map(apt => {
      if ((apt._id && apt._id === id) || apt.id === id) {
        return { ...apt, status: newStatus };
      }
      return apt;
    }));

    try {
      await updateAppointmentStatus(id, newStatus);
    } catch (e) {
      console.error('Failed to sync appointment status:', e);
    }
  };

  // Handler: Add New Walk-in Patient
  const handleAddWalkIn = async (patientData) => {
    const nextTokenNo = `T-0${appointments.length + 1}`;
    const newApt = {
      id: `apt_${Date.now()}`,
      tokenNo: nextTokenNo,
      ...patientData,
      bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAppointments(prev => [newApt, ...prev]);

    // Also update doctor's booked count
    setDoctors(prev => prev.map(doc => {
      const docMatch = (doc._id && doc._id === patientData.doctorId) || doc.id === patientData.doctorId;
      if (docMatch) {
        return { ...doc, bookedSlotsToday: doc.bookedSlotsToday + 1 };
      }
      return doc;
    }));

    try {
      await createWalkInAppointment({
        businessSlug: clinic.slug || 'sanjeevani-clinic',
        doctorId: patientData.doctorId,
        patientName: patientData.patientName,
        patientPhone: patientData.phone,
        timeSlot: patientData.timeSlot,
        symptoms: patientData.symptoms
      });
      loadDashboardData();
    } catch (e) {
      console.error('Failed to persist walk-in to MongoDB:', e);
    }
  };

  // Handler: Toggle Doctor Duty
  const handleToggleDoctorDuty = async (doctorId) => {
    setDoctors(prev => prev.map(doc => {
      if ((doc._id && doc._id === doctorId) || doc.id === doctorId) {
        return { ...doc, isOnDuty: !doc.isOnDuty };
      }
      return doc;
    }));

    try {
      await toggleDoctorDuty(doctorId);
    } catch (e) {
      console.error('Failed to sync doctor duty to MongoDB:', e);
    }
  };

  // Handler: Set Doctor Delay
  const handleSetDoctorDelay = async (doctorId, minutes) => {
    setDoctors(prev => prev.map(doc => {
      if ((doc._id && doc._id === doctorId) || doc.id === doctorId) {
        return { ...doc, delayMinutes: minutes };
      }
      return doc;
    }));

    const targetDoc = doctors.find(d => (d._id && d._id === doctorId) || d.id === doctorId);
    if (minutes > 0 && targetDoc) {
      const delayText = `${targetDoc.name} (${targetDoc.speciality}) is running ~${minutes} mins late. Appointments are slightly adjusted.`;
      setClinic(prev => ({
        ...prev,
        emergencyNotice: delayText,
        hasActiveEmergencyNotice: true,
      }));
      updateEmergencyBroadcast(clinic.slug || 'sanjeevani-clinic', delayText, true).catch(() => {});
    }

    try {
      await setDoctorDelay(doctorId, minutes);
    } catch (e) {
      console.error('Failed to sync doctor delay to MongoDB:', e);
    }
  };

  // Handler: Save Emergency Broadcast
  const handleSaveBroadcast = async ({ notice, isActive }) => {
    setClinic(prev => ({
      ...prev,
      emergencyNotice: notice,
      hasActiveEmergencyNotice: isActive,
    }));

    try {
      await updateEmergencyBroadcast(clinic.slug || 'sanjeevani-clinic', notice, isActive);
    } catch (e) {
      console.error('Failed to sync broadcast to MongoDB:', e);
    }
  };

  // Count pending graduate review tasks
  const pendingReviewsCount = appointments.filter(a => a.status === 'pending_graduate_review').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Clinic Header / Navigation */}
      <ClinicNavbar 
        clinic={clinic}
        onStatusChange={handleClinicStatusChange}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
      />

      {/* Emergency & Doctor Delay Banner */}
      <EmergencyAlertBanner 
        notice={clinic.emergencyNotice}
        isActive={clinic.hasActiveEmergencyNotice}
        onDismiss={() => {
          setClinic(prev => ({ ...prev, hasActiveEmergencyNotice: false }));
          updateEmergencyBroadcast(clinic.slug || 'sanjeevani-clinic', clinic.emergencyNotice, false).catch(() => {});
        }}
        onEdit={() => setIsEmergencyModalOpen(true)}
      />

      {/* Main Container */}
      <main className="dashboard-container" style={{ flex: 1 }}>
        {/* Real-time KPI Stats Overview */}
        <StatsOverview 
          appointments={appointments}
          doctors={doctors}
          aiInquiries={aiInquiries}
          graduate={graduate}
        />

        {/* 2-Column Responsive Cockpit Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Main Area (8 cols on desktop): Live Queue & Doctor Rosters */}
          <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Live Queue */}
            <LiveAppointmentQueue 
              appointments={appointments}
              doctors={doctors}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onOpenAddWalkIn={() => setIsAddWalkInOpen(true)}
            />

            {/* Doctor Availability & Shift Rosters */}
            <DoctorRosterGrid 
              doctors={doctors}
              onToggleDuty={handleToggleDoctorDuty}
              onSetDelay={handleSetDoctorDelay}
            />
          </div>

          {/* Lower Row (Side by side widgets): Assigned Graduate & Gemini AI Feed */}
          <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Assigned Graduate Specialist (Human-in-the-Loop) */}
            <AssignedGraduateCard 
              graduate={graduate}
              pendingReviewsCount={pendingReviewsCount}
            />

            {/* Gemini AI Live Triage Feed */}
            <AiInquiryFeed 
              inquiries={aiInquiries}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '12.5px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>OpsLoop Platform</strong> • Clinic Client Portal (Branch: <code>client</code>)
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              background: isDbConnected ? 'var(--emerald-50)' : 'var(--amber-50)',
              color: isDbConnected ? 'var(--emerald-700)' : 'var(--amber-700)',
              border: `1px solid ${isDbConnected ? 'var(--emerald-200)' : 'var(--amber-200)'}`
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDbConnected ? 'var(--emerald-600)' : 'var(--amber-600)' }} />
              {isDbConnected ? 'MongoDB Atlas Live Sync' : 'Offline Mode'}
            </span>
          </span>
          <span>
            Powered by <strong>Google Gemini AI</strong> Free Tier • Native MERN Automation
          </span>
        </div>
      </footer>

      {/* Modals */}
      {isQrModalOpen && (
        <QrStandeeModal 
          clinic={clinic}
          publicUrl={publicUrl}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

      {isAddWalkInOpen && (
        <AddWalkInModal 
          doctors={doctors}
          onAddAppointment={handleAddWalkIn}
          onClose={() => setIsAddWalkInOpen(false)}
        />
      )}

      {isEmergencyModalOpen && (
        <EmergencyBroadcastModal 
          clinic={clinic}
          onSaveBroadcast={handleSaveBroadcast}
          onClose={() => setIsEmergencyModalOpen(false)}
        />
      )}
    </div>
  );
}
