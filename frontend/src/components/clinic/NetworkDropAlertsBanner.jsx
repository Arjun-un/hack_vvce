import React from 'react';
import { 
  WifiOff, 
  Phone, 
  UserCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Stethoscope,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function NetworkDropAlertsBanner({ 
  alerts = [], 
  onConfirmAlert, 
  onDismissAlert 
}) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '1.5px solid #fde68a',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      marginBottom: '20px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: '1px solid #fcd34d',
        paddingBottom: '12px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: '#d97706',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <WifiOff size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#92400e' }}>
                Customer Network Drop Alerts
              </h3>
              <span style={{
                background: '#b45309',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {alerts.length} Pending
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#b45309' }}>
              These patients encountered mobile internet timeouts while booking online. Immediate desk confirmation or callback advised.
            </p>
          </div>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fcd34d' }}>
          Hospital Emergency Dispatch Active
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.map((alert) => {
          const alertId = alert._id || alert.id;

          return (
            <div 
              key={alertId}
              style={{
                background: '#ffffff',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              {/* Left Details */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>
                    {alert.patientName}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ({alert.age ? `${alert.age} yrs, ` : ''}{alert.gender || 'Patient'})
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#92400e',
                    background: '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #fcd34d'
                  }}>
                    Requested: {alert.timeSlot}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b', fontWeight: 600 }}>
                    <Phone size={13} color="#d97706" /> {alert.patientPhone}
                  </span>
                  <span>•</span>
                  <span>Doctor: <strong>{alert.doctorName}</strong></span>
                  <span>•</span>
                  <span>Symptoms: <em>"{alert.symptoms}"</em></span>
                </div>

                {alert.errorReason && (
                  <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                    Reason: {alert.errorReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* 1. Call Patient Button */}
                <a
                  href={`tel:${alert.patientPhone}`}
                  className="btn btn-secondary btn-sm"
                  style={{
                    textDecoration: 'none',
                    borderColor: '#fcd34d',
                    color: '#b45309',
                    background: '#fffbeb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Call patient back immediately"
                >
                  <Phone size={14} />
                  <span>Call Patient</span>
                </a>

                {/* 2. Manually Confirm and Issue Token */}
                <button
                  type="button"
                  onClick={() => onConfirmAlert(alertId)}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    borderColor: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Confirm appointment and assign OPD queue token"
                >
                  <UserCheck size={14} />
                  <span>Confirm as Walk-In</span>
                </button>

                {/* 3. Dismiss Button */}
                <button
                  type="button"
                  onClick={() => onDismissAlert(alertId)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '4px'
                  }}
                  title="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
