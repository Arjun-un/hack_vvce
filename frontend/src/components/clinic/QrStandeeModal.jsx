import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check, ExternalLink, ShieldCheck, Sparkles, Globe } from 'lucide-react';

export default function QrStandeeModal({ clinic, onClose, publicUrl }) {
  const [copied, setCopied] = useState(false);
  
  // Prefer public ngrok URL if available, else current origin
  const baseUrl = publicUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const portalUrl = `${baseUrl}/qr/${clinic.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content printable-standee" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', textAlign: 'center', padding: '28px' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-ai" style={{ fontSize: '11px' }}>
              <Sparkles size={11} /> Reception Counter Standee
            </span>
            {publicUrl && (
              <span className="badge badge-confirmed" style={{ fontSize: '11px' }}>
                <Globe size={11} /> Worldwide Active
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Standee Visual */}
        <div style={{
          background: 'linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 20px',
          border: '2px solid var(--teal-200)',
          marginBottom: '20px'
        }}>
          {/* Clinic Brand */}
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--teal-800)', margin: '0 0 4px 0' }}>
              {clinic.name}
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              {clinic.address}
            </p>
          </div>

          {/* QR Code Container */}
          <div style={{
            display: 'inline-block',
            background: '#ffffff',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px'
          }}>
            <QRCodeSVG 
              value={portalUrl}
              size={210}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Scan with Any Mobile Camera
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Instant Doctor Appointment Booking • Timings & Fees • Zero App Download Needed
            </p>
          </div>

          {/* Display public URL */}
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            wordBreak: 'break-all',
            padding: '4px 8px',
            background: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-subtle)',
            marginTop: '8px'
          }}>
            {portalUrl}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--teal-700)',
            fontWeight: 600,
            marginTop: '8px',
            background: '#ffffff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--teal-100)'
          }}>
            <ShieldCheck size={13} />
            <span>Automated & Verified by OpsLoop AI</span>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden when printed) */}
        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button 
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <Printer size={15} />
            <span>Print Counter Standee</span>
          </button>

          <button 
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            {copied ? <Check size={15} style={{ color: 'var(--emerald-600)' }} /> : <Copy size={15} />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
