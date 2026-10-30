import React from 'react';
import { 
  Stethoscope, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Power,
  Calendar
} from 'lucide-react';

export default function DoctorRosterGrid({ doctors, onToggleDuty, onSetDelay }) {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
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
        <div>
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Doctor Rosters & Availability</span>
            <span className="badge badge-confirmed" style={{ fontSize: '11px' }}>
              {doctors.filter(d => d.isOnDuty).length} Active Today
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Toggle duty statuses and broadcast delay alerts directly to the patient QR booking portal.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '16px'
      }}>
        {doctors.map(doc => {
          const occupancyPct = Math.round((doc.bookedSlotsToday / doc.maxSlotsToday) * 100);

          return (
            <div 
              key={doc.id}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                background: doc.isOnDuty ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                opacity: doc.isOnDuty ? 1 : 0.75,
                transition: 'var(--transition)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Doctor Head */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={doc.avatar} 
                      alt={doc.name} 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${doc.isOnDuty ? 'var(--teal-500)' : 'var(--border-subtle)'}`
                      }}
                    />
                    <div>
                      <h3 style={{ fontSize: '15px', margin: 0, color: 'var(--text-main)' }}>
                        {doc.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--teal-700)', fontWeight: 600, margin: '2px 0 0 0' }}>
                        {doc.speciality}
                      </p>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                        {doc.qualification}
                      </p>
                    </div>
                  </div>

                  {/* Duty Toggle Button */}
                  <button
                    onClick={() => onToggleDuty(doc.id)}
                    title={doc.isOnDuty ? 'Click to mark Off-Duty' : 'Click to mark On-Duty'}
                    style={{
                      border: 'none',
                      background: doc.isOnDuty ? 'var(--emerald-50)' : 'var(--bg-surface)',
                      color: doc.isOnDuty ? 'var(--emerald-600)' : 'var(--text-dim)',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: `1px solid ${doc.isOnDuty ? 'var(--emerald-200)' : 'var(--border-subtle)'}`
                    }}
                  >
                    <Power size={13} />
                    <span>{doc.isOnDuty ? 'ON DUTY' : 'OFF'}</span>
                  </button>
                </div>

                {/* Details (Cabin & Shift) */}
                <div style={{
                  marginTop: '14px',
                  padding: '10px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                    <MapPin size={13} style={{ color: 'var(--teal-600)' }} />
                    <span>{doc.room}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Clock size={13} style={{ color: 'var(--teal-600)' }} />
                    <span>{doc.shift}</span>
                  </div>
                </div>

                {/* Delay Notice Flag */}
                {doc.delayMinutes > 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--rose-50)',
                    color: 'var(--rose-700)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={13} />
                    <span>Running ~{doc.delayMinutes} mins late</span>
                  </div>
                )}
              </div>

              {/* Slot Occupancy Bar & Quick Actions */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Daily Slots Filled:</span>
                  <span style={{ color: occupancyPct > 80 ? 'var(--rose-600)' : 'var(--teal-700)' }}>
                    {doc.bookedSlotsToday} / {doc.maxSlotsToday} ({occupancyPct}%)
                  </span>
                </div>
                
                {/* Progress bar */}
                <div style={{
                  height: '6px',
                  background: 'var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${occupancyPct}%`,
                    background: occupancyPct > 80 ? 'var(--rose-600)' : 'var(--teal-600)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Quick Delay Adjustment */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onSetDelay(doc.id, doc.delayMinutes === 0 ? 15 : 0)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '11.5px', padding: '4px' }}
                  >
                    {doc.delayMinutes > 0 ? 'Clear Delay' : '+15m Delay Notice'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
