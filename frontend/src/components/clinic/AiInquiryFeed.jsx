import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight 
} from 'lucide-react';

export default function AiInquiryFeed({ inquiries }) {
  const getIntentBadge = (intent) => {
    switch (intent) {
      case 'general_faq':
        return <span className="badge badge-ai" style={{ fontSize: '11px' }}>FAQ Auto-Answered</span>;
      case 'appointment_conflict':
        return <span className="badge badge-pending-review" style={{ fontSize: '11px' }}>Graduate Dispatched</span>;
      case 'emergency_escalation':
        return <span className="badge badge-cancelled" style={{ fontSize: '11px' }}>⚠️ Emergency Triage</span>;
      default:
        return <span className="badge badge-ai" style={{ fontSize: '11px' }}>AI Classified</span>;
    }
  };

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
            background: 'var(--indigo-50)',
            color: 'var(--indigo-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Gemini AI Inquiry Triage</h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
              Live WhatsApp & QR questions answered
            </p>
          </div>
        </div>
      </div>

      {/* Inquiry List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {inquiries.map(inq => (
          <div 
            key={inq.id}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {inq.senderName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  • {inq.senderPhone}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-dim)' }}>
                <Clock size={11} />
                <span>{inq.timestamp}</span>
              </div>
            </div>

            {/* Patient Message */}
            <div style={{
              fontSize: '12.5px',
              color: 'var(--text-main)',
              fontStyle: 'italic',
              background: 'var(--bg-surface)',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--border-strong)',
              marginBottom: '8px'
            }}>
              "{inq.rawMessage}"
            </div>

            {/* AI Response and Badge */}
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              marginBottom: '8px'
            }}>
              <strong style={{ color: 'var(--indigo-600)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} /> Gemini 2.0:
              </strong>{' '}
              {inq.aiResponse}
            </div>

            {/* Footer with Tag & Confidence */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
              {getIntentBadge(inq.intent)}
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                Confidence: {Math.round(inq.aiConfidence * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
