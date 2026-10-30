import React from 'react';
import { 
  HeadphonesIcon, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export default function AssignedGraduateCard({ graduate, pendingReviewsCount }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--teal-50)',
            color: 'var(--teal-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HeadphonesIcon size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Assigned Graduate Specialist</h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
              Human-in-the-Loop Operations Support
            </p>
          </div>
        </div>
        <span className="badge badge-confirmed" style={{ fontSize: '11px' }}>
          Active On Duty
        </span>
      </div>

      {/* Profile info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px'
      }}>
        <img 
          src={graduate.avatar} 
          alt={graduate.name} 
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--teal-600)'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h4 style={{ fontSize: '15px', margin: 0 }}>{graduate.name}</h4>
            <ShieldCheck size={15} style={{ color: 'var(--teal-600)' }} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--teal-700)', fontWeight: 600, margin: '2px 0 0 0' }}>
            {graduate.title}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
            Assigned to Sanjeevani Clinic
          </p>
        </div>
      </div>

      {/* Task Performance Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '10px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teal-700)' }}>
            {graduate.tasksResolvedToday}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Tasks Resolved Today
          </div>
        </div>

        <div style={{
          padding: '10px',
          background: pendingReviewsCount > 0 ? 'var(--amber-50)' : 'var(--bg-subtle)',
          border: pendingReviewsCount > 0 ? '1px solid var(--amber-200)' : 'none',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: pendingReviewsCount > 0 ? 'var(--amber-700)' : 'var(--text-muted)' 
          }}>
            {pendingReviewsCount}
          </div>
          <div style={{ fontSize: '11px', color: pendingReviewsCount > 0 ? 'var(--amber-800)' : 'var(--text-muted)' }}>
            In Active Review
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a 
          href={`tel:${graduate.phone}`}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Phone size={13} style={{ color: 'var(--teal-600)' }} />
          <span>Call Graduate ({graduate.phone})</span>
        </a>

        <a 
          href={`mailto:${graduate.email}`}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Mail size={13} style={{ color: 'var(--teal-600)' }} />
          <span>Email Support Ticket</span>
        </a>
      </div>
    </div>
  );
}
