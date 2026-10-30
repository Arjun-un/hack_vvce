import React, { useState } from 'react';
import { X, UserPlus, Stethoscope, Phone, Clock, FileText } from 'lucide-react';

export default function AddWalkInModal({ doctors, onAddAppointment, onClose }) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [timeSlot, setTimeSlot] = useState('11:45 AM');
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim()) return;

    const selectedDoc = doctors.find(d => (d._id && d._id === doctorId) || d.id === doctorId) || doctors[0];

    onAddAppointment({
      patientName,
      phone,
      age: age ? Number(age) : undefined,
      gender,
      bloodGroup,
      doctorId: selectedDoc._id || selectedDoc.id,
      doctorName: selectedDoc.name,
      timeSlot,
      symptoms: symptoms.trim() || 'General Consultation / Walk-in',
      status: 'checked_in', // direct to waiting room!
      bookingSource: 'walk_in',
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--teal-50)',
              color: 'var(--teal-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', margin: 0 }}>Register Walk-In Patient</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Adds patient directly to today's active waiting room
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Patient Name */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Patient Full Name *
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. Suresh Kumar"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                background: 'var(--bg-subtle)'
              }}
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Mobile Number *
            </label>
            <input 
              type="tel" 
              required
              placeholder="e.g. +91 98450 11223"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                background: 'var(--bg-subtle)'
              }}
            />
          </div>

          {/* Age & Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Age (Years)
              </label>
              <input 
                type="number" 
                placeholder="e.g. 34"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  background: 'var(--bg-subtle)'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  background: 'var(--bg-subtle)'
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Doctor & Slot Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Consulting Doctor
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  background: 'var(--bg-subtle)'
                }}
              >
                {doctors.map(d => {
                  const docId = d._id || d.id;
                  return (
                    <option key={docId} value={docId}>
                      {d.name} ({d.room})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Time Slot
              </label>
              <input 
                type="text" 
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  background: 'var(--bg-subtle)'
                }}
              />
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Chief Symptoms / Notes
            </label>
            <textarea 
              rows={2}
              placeholder="e.g. Mild headache, fever since morning..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                outline: 'none',
                background: 'var(--bg-subtle)',
                resize: 'none'
              }}
            />
          </div>

          {/* Buttons */}
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
              Add to Waiting Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
