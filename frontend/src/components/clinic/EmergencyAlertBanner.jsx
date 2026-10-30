import React from 'react';
import { AlertTriangle, X, Edit3 } from 'lucide-react';

export default function EmergencyAlertBanner({ 
  notice, 
  isActive, 
  onDismiss, 
  onEdit 
}) {
  if (!isActive || !notice) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #fff1f2, #ffe4e6)',
      borderBottom: '1px solid #fecdd3',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--rose-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0
        }}>
          <AlertTriangle size={16} />
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--rose-700)', fontWeight: 500 }}>
          <strong style={{ fontWeight: 700, marginRight: '6px' }}>Active Broadcast (Visible on Patient QR Portal):</strong>
          {notice}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onEdit}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px', fontSize: '12px', background: '#fff' }}
          title="Edit Broadcast"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--rose-700)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-sm)'
          }}
          title="Dismiss Broadcast"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
