import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Timer,
  Calendar,
  Sparkles
} from 'lucide-react';
import { clinicHoldSlotApi, clinicReleaseSlotApi } from '../../services/api';

const MORNING_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'
];

const EVENING_SLOTS = [
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', 
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
];

export default function ClinicSlotManager({ 
  clinicSlug = 'sanjeevani-clinic',
  doctors = [], 
  appointments = [], 
  activeSlotLocks = [], 
  onRefreshLocks 
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?._id || doctors[0]?.id || '');
  const [actionLoadingSlot, setActionLoadingSlot] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Keep selectedDoctorId in sync if doctors load late
  useEffect(() => {
    if (!selectedDoctorId && doctors.length > 0) {
      setSelectedDoctorId(doctors[0]._id || doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Update current time every second for smooth live countdown display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedDoc = doctors.find(d => (d._id && d._id === selectedDoctorId) || d.id === selectedDoctorId) || doctors[0];

  // Helper to format remaining seconds into "MM:SS" or "Xm left"
  const getLockInfo = (timeSlot) => {
    if (!selectedDoc) return null;
    const docIdStr = String(selectedDoc._id || selectedDoc.id);

    const lock = activeSlotLocks.find(l => {
      const lockDocId = String(l.doctorId?._id || l.doctorId);
      return lockDocId === docIdStr && l.timeSlot?.trim() === timeSlot.trim();
    });

    if (!lock) return null;

    const expiresAtMs = new Date(lock.expiresAt).getTime();
    const remainingMs = expiresAtMs - currentTime;
    if (remainingMs <= 0) return null; // already expired!

    const remainingSecs = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    const formattedTimer = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return {
      ...lock,
      remainingSecs,
      remainingMins: Math.ceil(remainingSecs / 60),
      formattedTimer
    };
  };

  // Helper to check if slot is booked by a confirmed appointment
  const getBookedAppointment = (timeSlot) => {
    if (!selectedDoc) return null;
    const docIdStr = String(selectedDoc._id || selectedDoc.id);

    return appointments.find(apt => {
      const aptDocId = String(apt.doctorId?._id || apt.doctorId);
      return aptDocId === docIdStr && 
             apt.timeSlot?.trim() === timeSlot.trim() && 
             ['confirmed', 'checked_in', 'in_consultation'].includes(apt.status);
    });
  };

  // Handler: Hold / Block slot for 20 minutes from the Client Page
  const handleHoldSlot = async (timeSlot) => {
    if (!selectedDoc) return;
    const docId = selectedDoc._id || selectedDoc.id;
    setActionLoadingSlot(timeSlot);
    setSuccessMsg('');

    try {
      await clinicHoldSlotApi({
        businessSlug: clinicSlug,
        doctorId: docId,
        timeSlot,
        notes: `Blocked from Clinic Client Desk for 20 mins`
      });

      setSuccessMsg(`Slot ${timeSlot} successfully blocked for 20 minutes! Customer booking is temporarily reserved.`);
      if (onRefreshLocks) onRefreshLocks();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to hold slot');
    } finally {
      setActionLoadingSlot(null);
      setTimeout(() => setSuccessMsg(''), 6000);
    }
  };

  // Handler: Unblock / Release slot immediately
  const handleReleaseSlot = async (timeSlot) => {
    if (!selectedDoc) return;
    const docId = selectedDoc._id || selectedDoc.id;
    setActionLoadingSlot(timeSlot);
    setSuccessMsg('');

    try {
      await clinicReleaseSlotApi({
        doctorId: docId,
        timeSlot
      });

      setSuccessMsg(`Slot ${timeSlot} unblocked! It is now immediately open for customer bookings.`);
      if (onRefreshLocks) onRefreshLocks();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to unblock slot');
    } finally {
      setActionLoadingSlot(null);
      setTimeout(() => setSuccessMsg(''), 6000);
    }
  };

  const renderSlotButton = (slot) => {
    const lockInfo = getLockInfo(slot);
    const bookedApt = getBookedAppointment(slot);
    const isLoading = actionLoadingSlot === slot;

    // 1. Confirmed Booked Slot
    if (bookedApt) {
      return (
        <div 
          key={slot}
          style={{
            padding: '10px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--slate-100, #f1f5f9)',
            border: '1px solid var(--slate-300, #cbd5e1)',
            color: 'var(--text-dim)',
            fontSize: '11.5px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2px',
            opacity: 0.85
          }}
          title={`Booked for ${bookedApt.patientName} (${bookedApt.tokenNo})`}
        >
          <div style={{ fontWeight: 700, color: '#334155' }}>{slot}</div>
          <span style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            <CheckCircle2 size={11} /> Booked ({bookedApt.tokenNo})
          </span>
        </div>
      );
    }

    // 2. Currently Blocked / Held (20-Minute Lock)
    if (lockInfo) {
      return (
        <div
          key={slot}
          style={{
            padding: '10px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--amber-50, #fffbeb)',
            border: '1.5px solid var(--amber-400, #f59e0b)',
            color: 'var(--amber-900, #78350f)',
            fontSize: '11.5px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)'
          }}
        >
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} color="#b45309" /> {slot}
          </div>
          
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            background: '#b45309',
            color: '#ffffff',
            padding: '1px 6px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Timer size={10} /> {lockInfo.formattedTimer} left
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleReleaseSlot(slot)}
            style={{
              marginTop: '2px',
              border: 'none',
              background: '#ffffff',
              color: '#b45309',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              border: '1px solid #fcd34d'
            }}
            title="Click to release lock early and reopen slot for customer booking"
          >
            <Unlock size={10} /> {isLoading ? 'Releasing...' : 'Unblock Now'}
          </button>
        </div>
      );
    }

    // 3. Available Slot (Click to Block for 20 Mins)
    return (
      <div
        key={slot}
        style={{
          padding: '10px 8px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--emerald-300, #a7f3d0)',
          color: 'var(--text-main)',
          fontSize: '11.5px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--emerald-800, #065f46)' }}>{slot}</div>
        <span style={{ fontSize: '10px', color: 'var(--emerald-600, #059669)', fontWeight: 600 }}>
          ✓ Available
        </span>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleHoldSlot(slot)}
          style={{
            border: 'none',
            background: 'var(--emerald-50, #ecfdf5)',
            color: 'var(--emerald-700, #047857)',
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            border: '1px solid var(--emerald-200, #a7f3d0)'
          }}
          title="Click to hold this slot for 20 minutes (blocks it from customer booking)"
        >
          <Lock size={10} /> {isLoading ? 'Holding...' : 'Block 20 Mins'}
        </button>
      </div>
    );
  };

  const activeLocksCount = activeSlotLocks.filter(l => {
    if (!selectedDoc) return false;
    const docIdStr = String(selectedDoc._id || selectedDoc.id);
    const lockDocId = String(l.doctorId?._id || l.doctorId);
    return lockDocId === docIdStr && (new Date(l.expiresAt).getTime() > currentTime);
  }).length;

  return (
    <div className="card" style={{ marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', margin: 0, fontWeight: 800 }}>
                Client Slot Manager & 20-Minute Lock Controls
              </h2>
              {activeLocksCount > 0 && (
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700 }}>
                  <Lock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                  {activeLocksCount} Slot{activeLocksCount > 1 ? 's' : ''} Currently Blocked
                </span>
              )}
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Choose any slot to block it for <strong>exactly 20 minutes</strong>. While blocked, customers cannot book it. After 20 minutes, it automatically unblocks.
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshLocks}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}
        >
          <RefreshCw size={13} />
          <span>Refresh Live Locks</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--emerald-50, #ecfdf5)',
          border: '1px solid var(--emerald-300, #6ee7b7)',
          color: 'var(--emerald-800, #065f46)',
          fontSize: '12.5px',
          fontWeight: 600,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Doctor Selection Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {doctors.map(doc => {
          const docId = doc._id || doc.id;
          const isSelected = selectedDoctorId === docId;
          const docLocksCount = activeSlotLocks.filter(l => {
            const lockDocId = String(l.doctorId?._id || l.doctorId);
            return lockDocId === String(docId) && (new Date(l.expiresAt).getTime() > currentTime);
          }).length;

          return (
            <button
              key={docId}
              type="button"
              onClick={() => setSelectedDoctorId(docId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${isSelected ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                background: isSelected ? 'var(--teal-50)' : 'var(--bg-surface)',
                color: isSelected ? 'var(--teal-900)' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{doc.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({doc.speciality})</span>
              {docLocksCount > 0 && (
                <span style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '1px 6px',
                  lineHeight: 1.2
                }}>
                  {docLocksCount} locked
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Doctor Summary Banner */}
      {selectedDoc && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            Managing Slots for: <strong style={{ color: 'var(--text-main)' }}>{selectedDoc.name}</strong> • Room: <strong>{selectedDoc.room}</strong> • Shift: <strong>{selectedDoc.shift}</strong>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--emerald-700)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              Green: Available to Customer
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              Amber: Blocked for 20 Mins
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
              Gray: Booked Patient
            </span>
          </div>
        </div>
      )}

      {/* Slots Grid: Morning & Evening */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Morning OPD */}
        <div>
          <div style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>☀️ Morning Shift (09:00 AM - 01:00 PM)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {MORNING_SLOTS.map(slot => renderSlotButton(slot))}
          </div>
        </div>

        {/* Evening OPD */}
        <div>
          <div style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🌙 Evening Shift (04:00 PM - 08:00 PM)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {EVENING_SLOTS.map(slot => renderSlotButton(slot))}
          </div>
        </div>
      </div>
    </div>
  );
}
