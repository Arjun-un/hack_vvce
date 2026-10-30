import React, { useState } from 'react';
import { X, BellRing, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function EmergencyBroadcastModal({ clinic, onSaveBroadcast, onClose }) {
  const [notice, setNotice] = useState(clinic.emergencyNotice || '');
  const [isActive, setIsActive] = useState(clinic.hasActiveEmergencyNotice);

  const templates = [
    'Dr. Sneha is running 20 mins late due to an emergency pediatric procedure at hospital.',
    'Clinic morning OPD will close at 1:00 PM today due to scheduled maintenance.',
    'All walk-in tokens for General Physician are fully booked today. Please book for tomorrow.',
    'Doctor delayed by 30 mins due to traffic congestion. Next consultations start shortly.'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveBroadcast({
      notice: notice.trim(),
      isActive: isActive && notice.trim().length > 0
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--rose-50)',
              color: 'var(--rose-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BellRing size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', margin: 0 }}>Emergency & Delay Broadcast</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Broadcast live warnings to all patients on the QR booking portal
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Active Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: isActive ? 'var(--rose-50)' : 'var(--bg-subtle)',
            border: `1px solid ${isActive ? 'var(--rose-200)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: isActive ? 'var(--rose-700)' : 'var(--text-main)' }}>
                {isActive ? 'Broadcast is ACTIVE' : 'Broadcast is DISABLED'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isActive ? 'Displayed prominently on customer QR page' : 'Patients see normal booking options'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}`}
            >
              {isActive ? 'Turn Off' : 'Enable'}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Quick Templates:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setNotice(tpl);
                    setIsActive(true);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    color: 'var(--text-main)'
                  }}
                >
                  ⚡ {tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast Message Input */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Custom Announcement Text
            </label>
            <textarea 
              rows={3}
              placeholder="e.g. Dr. Rajesh is attending emergency ward, appointments delayed by 20 mins..."
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                background: 'var(--bg-subtle)',
                resize: 'none'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Update Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
