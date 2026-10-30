import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  QrCode, 
  User, 
  Phone, 
  Stethoscope, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  Check, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function LiveAppointmentQueue({ 
  appointments, 
  doctors, 
  onUpdateStatus, 
  onOpenAddWalkIn 
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Today', count: appointments.length },
    { id: 'waiting', label: 'Waiting Room', count: appointments.filter(a => a.status === 'checked_in').length },
    { id: 'consulting', label: 'In Consultation', count: appointments.filter(a => a.status === 'in_consultation').length },
    { id: 'confirmed', label: 'Scheduled / Upcoming', count: appointments.filter(a => a.status === 'confirmed').length },
    { id: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
    { id: 'pending_graduate_review', label: 'Graduate Review', count: appointments.filter(a => a.status === 'pending_graduate_review').length },
  ];

  // Filtering Logic
  const filteredAppointments = appointments.filter(apt => {
    // Tab filter
    if (activeTab === 'waiting' && apt.status !== 'checked_in') return false;
    if (activeTab === 'consulting' && apt.status !== 'in_consultation') return false;
    if (activeTab === 'confirmed' && apt.status !== 'confirmed') return false;
    if (activeTab === 'completed' && apt.status !== 'completed') return false;
    if (activeTab === 'pending_graduate_review' && apt.status !== 'pending_graduate_review') return false;

    // Doctor filter
    if (selectedDoctor !== 'all' && apt.doctorId !== selectedDoctor) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = apt.patientName.toLowerCase().includes(q);
      const matchPhone = apt.phone.includes(q);
      const matchToken = apt.tokenNo.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchToken) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge badge-confirmed">Confirmed</span>;
      case 'checked_in':
        return <span className="badge badge-waiting">In Waiting Room</span>;
      case 'in_consultation':
        return <span className="badge badge-consulting">With Doctor</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'pending_graduate_review':
        return <span className="badge badge-pending-review">Graduate Review</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      {/* Header and Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Live Patient Queue & Appointments</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-700)', background: 'var(--teal-50)', padding: '2px 8px', borderRadius: '12px' }}>
              Real-time
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Track patient arrivals, doctor consultations, and auto-booked QR requests.
          </p>
        </div>

        {/* Search & Doctor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Search patient, phone, token..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 34px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                width: '230px',
                background: 'var(--bg-subtle)'
              }}
            />
          </div>

          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              outline: 'none',
              background: 'var(--bg-surface)',
              fontWeight: 500
            }}
          >
            <option value="all">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.speciality.split(' ')[0]})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        marginBottom: '16px',
        paddingBottom: '4px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === tab.id ? 'var(--teal-600)' : 'var(--bg-subtle)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
              transition: 'var(--transition)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.25)' : 'var(--border-subtle)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-main)'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Appointment Table */}
      <div className="table-wrapper">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Token / Time</th>
              <th>Patient Details</th>
              <th>Doctor & Cabin</th>
              <th>Chief Complaint</th>
              <th>Source</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No appointments found for the selected filter.
                </td>
              </tr>
            ) : (
              filteredAppointments.map(apt => (
                <tr key={apt.id}>
                  {/* Token & Slot */}
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--teal-700)', fontSize: '14px' }}>
                      {apt.tokenNo}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{apt.timeSlot}</span>
                    </div>
                  </td>

                  {/* Patient Info */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {apt.patientName}
                    </div>
                    {(apt.age || apt.gender || apt.bloodGroup) && (
                      <div style={{ fontSize: '11.5px', color: 'var(--teal-700)', fontWeight: 600 }}>
                        {[apt.age ? `${apt.age} yrs` : '', apt.gender !== 'Not specified' ? apt.gender : '', apt.bloodGroup].filter(Boolean).join(' • ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={11} />
                      <span>{apt.phone || apt.patientPhone}</span>
                    </div>
                  </td>

                  {/* Doctor & Cabin */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
                      {apt.doctorName}
                    </div>
                    {doctors.find(d => d.id === apt.doctorId) && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {doctors.find(d => d.id === apt.doctorId).room} • {doctors.find(d => d.id === apt.doctorId).speciality}
                      </div>
                    )}
                  </td>

                  {/* Complaint */}
                  <td style={{ maxWidth: '220px' }}>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={apt.symptoms}>
                      {apt.symptoms}
                    </div>
                    {apt.conflictReason && (
                      <div style={{ fontSize: '11px', color: 'var(--amber-700)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <AlertCircle size={11} />
                        <span>{apt.conflictReason}</span>
                      </div>
                    )}
                  </td>

                  {/* Source */}
                  <td>
                    {apt.bookingSource === 'qr_ai' ? (
                      <span className="badge badge-ai" style={{ fontSize: '11px' }}>
                        <QrCode size={11} />
                        <span>QR Scan</span>
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569' }}>
                        <User size={11} />
                        <span>Front-Desk</span>
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    {getStatusBadge(apt.status)}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    {apt.status === 'confirmed' && (
                      <button 
                        onClick={() => onUpdateStatus(apt.id, 'checked_in')}
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: 'var(--blue-600)', color: 'var(--blue-700)', background: 'var(--blue-50)' }}
                      >
                        <CheckCircle size={13} />
                        <span>Check In</span>
                      </button>
                    )}

                    {apt.status === 'checked_in' && (
                      <button 
                        onClick={() => onUpdateStatus(apt.id, 'in_consultation')}
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: 'var(--indigo-600)', color: 'var(--indigo-700)', background: 'var(--indigo-50)' }}
                      >
                        <PlayCircle size={13} />
                        <span>Send to Doctor</span>
                      </button>
                    )}

                    {apt.status === 'in_consultation' && (
                      <button 
                        onClick={() => onUpdateStatus(apt.id, 'completed')}
                        className="btn btn-primary btn-sm"
                      >
                        <Check size={13} />
                        <span>Mark Done</span>
                      </button>
                    )}

                    {apt.status === 'pending_graduate_review' && (
                      <button 
                        onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: 'var(--teal-600)', color: 'var(--teal-700)' }}
                      >
                        <span>Confirm Overwrite</span>
                      </button>
                    )}

                    {apt.status === 'completed' && (
                      <span style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: 600 }}>
                        ✓ Visit Finished
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
