import React from 'react';
import { 
  Users, 
  UserCheck, 
  Stethoscope, 
  Sparkles, 
  HeadphonesIcon 
} from 'lucide-react';

export default function StatsOverview({ appointments, doctors, aiInquiries, graduate }) {
  const totalAppointments = appointments.length;
  const qrBookedCount = appointments.filter(a => a.bookingSource === 'qr_ai').length;
  const waitingCount = appointments.filter(a => a.status === 'checked_in' || a.status === 'in_consultation').length;
  const activeDoctorsCount = doctors.filter(d => d.isOnDuty).length;
  const aiAutoResolvedCount = aiInquiries.filter(i => i.status === 'auto_resolved').length;
  const graduateTasksCount = appointments.filter(a => a.status === 'pending_graduate_review').length;

  const stats = [
    {
      title: "Today's Appointments",
      value: totalAppointments,
      subtext: `${qrBookedCount} via QR Code • ${totalAppointments - qrBookedCount} Walk-in`,
      icon: Users,
      color: 'var(--teal-600)',
      bg: 'var(--teal-50)',
      borderColor: 'var(--teal-200)',
    },
    {
      title: 'Current Waiting Queue',
      value: waitingCount,
      subtext: `${appointments.filter(a => a.status === 'checked_in').length} Waiting • ${appointments.filter(a => a.status === 'in_consultation').length} with Doctor`,
      icon: UserCheck,
      color: 'var(--blue-600)',
      bg: 'var(--blue-50)',
      borderColor: 'var(--blue-100)',
    },
    {
      title: 'Doctors On Duty',
      value: `${activeDoctorsCount} / ${doctors.length}`,
      subtext: 'Active Consultation Cabins',
      icon: Stethoscope,
      color: 'var(--emerald-600)',
      bg: 'var(--emerald-50)',
      borderColor: 'var(--emerald-100)',
    },
    {
      title: 'AI Inquiries Auto-Resolved',
      value: aiAutoResolvedCount,
      subtext: 'Powered by Gemini AI Free Tier',
      icon: Sparkles,
      color: 'var(--indigo-600)',
      bg: 'var(--indigo-50)',
      borderColor: 'var(--indigo-100)',
    },
    {
      title: 'Assigned Graduate Tasks',
      value: graduateTasksCount,
      subtext: `Managed by ${graduate.name}`,
      icon: HeadphonesIcon,
      color: graduateTasksCount > 0 ? 'var(--amber-600)' : 'var(--teal-700)',
      bg: graduateTasksCount > 0 ? 'var(--amber-50)' : 'var(--teal-50)',
      borderColor: graduateTasksCount > 0 ? 'var(--amber-200)' : 'var(--teal-200)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div 
            key={idx}
            className="card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${stat.color}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {stat.title}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: stat.bg,
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={18} />
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1
              }}>
                {stat.value}
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-dim)',
                marginTop: '6px',
                fontWeight: 500
              }}>
                {stat.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
