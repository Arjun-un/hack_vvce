import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  QrCode, 
  BellRing, 
  Clock, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  XCircle,
  Plus,
  ArrowLeft,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ClinicNavbar({ 
  clinic, 
  onStatusChange, 
  onOpenQrModal, 
  onOpenEmergencyModal,
  onOpenAddWalkIn
}) {
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return { label: 'Clinic Open', color: 'badge-confirmed', icon: CheckCircle2 };
      case 'lunch_break':
        return { label: 'Lunch Break', color: 'badge-pending-review', icon: PauseCircle };
      case 'emergency_only':
        return { label: 'Emergency Only', color: 'badge-cancelled', icon: AlertTriangle };
      case 'closed':
        return { label: 'Closed', color: 'badge-completed', icon: XCircle };
      default:
        return { label: status, color: 'badge-completed', icon: CheckCircle2 };
    }
  };

  const statusInfo = getStatusBadge(clinic.currentStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand & Clinic Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--teal-600), var(--teal-800))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.35)'
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {clinic.name}
              </h1>
              <span className="badge badge-ai" style={{ fontSize: '11px', padding: '2px 8px' }}>
                OpsLoop Active
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              {clinic.address} • <span style={{ color: 'var(--teal-700)', fontWeight: 600 }}>Front Desk Portal</span>
            </p>
          </div>
        </div>

        {/* Center / Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Real-time Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Clock size={15} style={{ color: 'var(--teal-600)' }} />
            <span>{timeStr}</span>
          </div>

          {/* Quick Clinic Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              className={`badge ${statusInfo.color}`}
              style={{
                cursor: 'pointer',
                padding: '7px 12px',
                fontSize: '13px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <StatusIcon size={16} />
              <span>{statusInfo.label}</span>
              <ChevronDown size={14} />
            </button>

            {isStatusMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                width: '180px',
                zIndex: 200
              }}>
                <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Set Clinic Status
                </div>
                {[
                  { id: 'open', label: 'Clinic Open', color: 'var(--emerald-600)' },
                  { id: 'lunch_break', label: 'Lunch Break', color: 'var(--amber-600)' },
                  { id: 'emergency_only', label: 'Emergency Only', color: 'var(--rose-600)' },
                  { id: 'closed', label: 'Closed for Day', color: 'var(--text-muted)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onStatusChange(item.id);
                      setIsStatusMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      background: clinic.currentStatus === item.id ? 'var(--bg-subtle)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontWeight: clinic.currentStatus === item.id ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Alert Broadcast Button */}
          <button 
            onClick={onOpenEmergencyModal}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: clinic.hasActiveEmergencyNotice ? 'var(--rose-600)' : 'var(--border-subtle)',
              color: clinic.hasActiveEmergencyNotice ? 'var(--rose-600)' : 'var(--text-main)',
              background: clinic.hasActiveEmergencyNotice ? 'var(--rose-50)' : 'var(--bg-surface)'
            }}
          >
            <BellRing size={15} />
            <span>Emergency Alert</span>
            {clinic.hasActiveEmergencyNotice && (
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--rose-600)'
              }} />
            )}
          </button>

          {/* Front Desk QR Standee Modal Button */}
          <button 
            onClick={onOpenQrModal}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'var(--teal-600)', color: 'var(--teal-700)' }}
          >
            <QrCode size={15} />
            <span>Reception QR Standee</span>
          </button>

          {/* New Walk-in Patient Button */}
          <button 
            onClick={onOpenAddWalkIn}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>New Walk-In</span>
          </button>

          {/* Return to Operator Workspace */}
          <Link
            to="/operator"
            className="btn btn-secondary btn-sm"
            style={{
              textDecoration: 'none',
              borderColor: '#c7d2fe',
              color: '#4338ca',
              background: '#eef2ff'
            }}
            title="Switch / View Operator Console"
          >
            <ArrowLeft size={14} />
            <span>Operator Console</span>
          </Link>

          {/* Authenticated Owner Profile & Sign Out */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '8px',
            borderLeft: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-main)'
            }}>
              <UserCheck size={14} color="var(--emerald-600)" />
              <span>{user?.name || 'Dr. Rajesh Sharma'}</span>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--rose-600)',
                background: 'var(--bg-surface)'
              }}
              title="Sign Out of Clinic Owner Cockpit"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
