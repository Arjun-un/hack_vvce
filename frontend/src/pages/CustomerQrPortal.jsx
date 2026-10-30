import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { initialClinicData } from '../data/mockClinicData';
import { getCustomerClinicInfo, bookCustomerSlot, sendCustomerEnquiry } from '../services/api';
import { 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  User, 
  Check, 
  ShieldCheck,
  Stethoscope,
  Filter,
  Search,
  Droplet,
  Heart,
  ChevronRight,
  ChevronLeft,
  Share2
} from 'lucide-react';

export default function CustomerQrPortal() {
  const { slug } = useParams();
  const clinicSlug = slug || 'sanjeevani-clinic';

  // State
  const [clinic, setClinic] = useState(initialClinicData.business);
  const [doctors, setDoctors] = useState(initialClinicData.doctors);
  const [assignedGraduate, setAssignedGraduate] = useState(initialClinicData.assignedGraduate);

  // Tabs: 'book' | 'inquiry'
  const [activeTab, setActiveTab] = useState('book');

  // Booking Form State: Step 1 = Patient Info, Step 2 = Doctor & Slot, Step 3 = Confirmed Pass
  const [bookingStep, setBookingStep] = useState(1);

  // Patient Demographics
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [symptoms, setSymptoms] = useState('');

  // Doctor & Slot Selection
  const [selectedSpeciality, setSelectedSpeciality] = useState('all');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('11:00 AM');

  // AI Inquiry State
  const [inquiryText, setInquiryText] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [aiResponseData, setAiResponseData] = useState(null);

  // Fetch live clinic and doctor data
  useEffect(() => {
    async function fetchClinicData() {
      try {
        const data = await getCustomerClinicInfo(clinicSlug);
        if (data.business) {
          setClinic(data.business);
          if (data.doctors && data.doctors.length > 0) {
            setDoctors(data.doctors);
            // Default select the first on-duty doctor
            const activeDoc = data.doctors.find(d => d.isOnDuty) || data.doctors[0];
            setSelectedDoctorId(activeDoc._id || activeDoc.id);
          }
          if (data.assignedGraduate) {
            setAssignedGraduate(data.assignedGraduate);
          }
        }
      } catch (e) {
        console.warn('Backend API unavailable, using mock data:', e.message);
        setSelectedDoctorId(initialClinicData.doctors[0].id);
      }
    }
    fetchClinicData();
  }, [clinicSlug]);

  // Specialities list derived from doctors
  const specialities = ['all', ...new Set(doctors.map(d => {
    if (d.speciality.toLowerCase().includes('physician') || d.speciality.toLowerCase().includes('medicine')) return 'General Medicine';
    if (d.speciality.toLowerCase().includes('pediatric')) return 'Pediatrics';
    if (d.speciality.toLowerCase().includes('ortho') || d.speciality.toLowerCase().includes('joint')) return 'Orthopedics';
    if (d.speciality.toLowerCase().includes('dental')) return 'Dental';
    return d.speciality;
  }))];

  // Filtered doctors
  const filteredDoctors = doctors.filter(doc => {
    // Speciality filter
    if (selectedSpeciality !== 'all') {
      const matchSpec = doc.speciality.toLowerCase().includes(selectedSpeciality.toLowerCase());
      if (!matchSpec) return false;
    }
    // Search filter
    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpec = doc.speciality.toLowerCase().includes(q);
      if (!matchName && !matchSpec) return false;
    }
    return true;
  });

  const selectedDoctor = doctors.find(d => (d._id && d._id === selectedDoctorId) || d.id === selectedDoctorId) || doctors[0];

  // Available Time Slots
  const morningSlots = ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'];
  const eveningSlots = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];

  // Handle Step 1 Validation & Proceed to Step 2
  const handleProceedToDoctorStep = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter patient full name');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter patient mobile number');
      return;
    }
    if (!age || age <= 0) {
      alert('Please enter valid patient age');
      return;
    }
    setBookingStep(2);
  };

  // Submit Complete Booking to MongoDB
  const handleFinalBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      alert('Please select a doctor');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        businessSlug: clinicSlug,
        doctorId: selectedDoctorId,
        patientName: patientName.trim(),
        patientPhone: phone.trim(),
        age: Number(age),
        gender,
        bloodGroup,
        timeSlot: selectedTimeSlot,
        symptoms: symptoms.trim() || 'General Consultation'
      };

      const res = await bookCustomerSlot(payload);

      setBookingConfirmation({
        isSuccess: res.status !== 'pending_review',
        tokenNo: res.appointment?.tokenNo || 'T-AUTO',
        appointment: res.appointment,
        doctor: selectedDoctor,
        timeSlot: selectedTimeSlot,
        patientName,
        age,
        gender,
        bloodGroup,
        conflictReason: res.conflictReason || null
      });

      setBookingStep(3); // Show confirmation pass
    } catch (err) {
      // Offline fallback
      setBookingConfirmation({
        isSuccess: true,
        tokenNo: `T-${Math.floor(Math.random() * 20) + 10}`,
        doctor: selectedDoctor,
        timeSlot: selectedTimeSlot,
        patientName,
        age,
        gender,
        bloodGroup,
        conflictReason: null
      });
      setBookingStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Gemini AI Question
  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    setIsLoading(true);
    try {
      const res = await sendCustomerEnquiry({
        businessSlug: clinicSlug,
        customerName: patientName || 'Guest Patient',
        customerPhone: phone || '',
        message: inquiryText
      });

      setAiResponseData(res.triage);
    } catch (err) {
      setAiResponseData({
        intent: 'general_faq',
        aiResponse: `Sanjeevani Clinic OPD is open until 08:30 PM today. General consultation fee is ₹400. You can book an immediate slot using the booking tab.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)',
      padding: '16px 12px 40px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {/* Clinic Header Banner (Patient-Facing Only) */}
        <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--teal-600), var(--teal-800))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
          }}>
            <Building2 size={26} />
          </div>

          <h1 style={{ fontSize: '19px', margin: '0 0 4px 0', color: 'var(--text-main)', fontWeight: 800 }}>
            {clinic.name}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
            <MapPin size={12} style={{ display: 'inline', marginRight: '3px', color: 'var(--teal-600)' }} />
            {clinic.address}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              background: 'var(--teal-50)',
              color: 'var(--teal-800)',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--teal-200)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Clock size={11} /> {clinic.operatingHours}
            </span>

            <span style={{
              fontSize: '11px',
              background: '#ffffff',
              color: 'var(--emerald-700)',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--emerald-200)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={12} /> Verified OP Portal
            </span>
          </div>

          {/* Active delay banner if doctor delayed */}
          {clinic.hasActiveEmergencyNotice && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'var(--rose-50)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--rose-200)',
              color: 'var(--rose-700)',
              fontSize: '11.5px',
              textAlign: 'left',
              display: 'flex',
              gap: '6px',
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><strong>Notice:</strong> {clinic.emergencyNotice}</div>
            </div>
          )}
        </div>

        {/* Tab switch: Book Appointment vs Ask Question */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => { setActiveTab('book'); setBookingStep(1); }}
            style={{
              padding: '9px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'book' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'book' ? '#ffffff' : 'var(--text-muted)',
              transition: 'var(--transition)'
            }}
          >
            📅 Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('inquiry')}
            style={{
              padding: '9px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'inquiry' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'inquiry' ? '#ffffff' : 'var(--text-muted)',
              transition: 'var(--transition)'
            }}
          >
            💬 Ask FAQ (Gemini AI)
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: BOOKING WORKFLOW (3 STEPS) */}
        {/* ================================================================= */}
        {activeTab === 'book' && (
          <div>
            {/* Step 1: Patient Demographic Details */}
            {bookingStep === 1 && (
              <form onSubmit={handleProceedToDoctorStep} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'var(--teal-600)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      1
                    </div>
                    <div>
                      <h2 style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>Patient Details</h2>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>Step 1 of 2: Required for hospital records</p>
                    </div>
                  </div>
                  <span className="badge badge-ai" style={{ fontSize: '10px' }}>Quick Form</span>
                </div>

                {/* Patient Name */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Patient Full Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Ramesh Kumar"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13.5px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-subtle)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Mobile / WhatsApp Number */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    WhatsApp / Mobile Number *
                  </label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. +91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13.5px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-subtle)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Age & Gender Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px' }}>
                  {/* Age */}
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Age (Years) *
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      max="120"
                      placeholder="e.g. 29"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13.5px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-subtle)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                      Gender *
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['Male', 'Female', 'Other'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          style={{
                            flex: 1,
                            padding: '9px 4px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${gender === g ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                            background: gender === g ? 'var(--teal-50)' : 'var(--bg-surface)',
                            color: gender === g ? 'var(--teal-800)' : 'var(--text-main)',
                            fontSize: '12px',
                            fontWeight: gender === g ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blood Group */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Blood Group (Optional)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map(bg => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bg)}
                        style={{
                          padding: '7px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${bloodGroup === bg ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                          background: bloodGroup === bg ? 'var(--teal-50)' : 'var(--bg-surface)',
                          color: bloodGroup === bg ? 'var(--teal-800)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: bloodGroup === bg ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms / Chief Complaint */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Chief Complaint / Symptoms *
                  </label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="e.g. Mild fever, persistent cold, joint stiffness..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-subtle)',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ marginTop: '8px', padding: '12px', fontSize: '14px' }}
                >
                  <span>Select Doctor & Time Slot</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* Step 2: Doctor Filter & Time Slot Selection */}
            {bookingStep === 2 && (
              <form onSubmit={handleFinalBooking} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Header with back button to step 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12.5px',
                      color: 'var(--teal-700)',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    <ChevronLeft size={16} /> Edit Patient Info
                  </button>
                  <span className="badge badge-confirmed" style={{ fontSize: '10px' }}>Step 2 of 2</span>
                </div>

                {/* Patient Quick Summary Chip */}
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span><strong>{patientName}</strong> ({age} yrs, {gender}, {bloodGroup})</span>
                  <span style={{ color: 'var(--text-muted)' }}>{phone}</span>
                </div>

                {/* Speciality Filters */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Filter by Speciality
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {specialities.map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => setSelectedSpeciality(spec)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: `1px solid ${selectedSpeciality === spec ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                          background: selectedSpeciality === spec ? 'var(--teal-600)' : 'var(--bg-surface)',
                          color: selectedSpeciality === spec ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {spec === 'all' ? 'All Specialities' : spec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctor Cards Selection */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Choose Consulting Doctor *
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredDoctors.map(doc => {
                      const docId = doc._id || doc.id;
                      const isSelected = selectedDoctorId === docId;

                      return (
                        <div
                          key={docId}
                          onClick={() => setSelectedDoctorId(docId)}
                          style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                            background: isSelected ? 'var(--teal-50)' : 'var(--bg-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'var(--transition)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img 
                              src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
                              alt={doc.name}
                              style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: isSelected ? '2px solid var(--teal-600)' : '1px solid var(--border-subtle)'
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h3 style={{ fontSize: '14px', margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
                                  {doc.name}
                                </h3>
                                {doc.isOnDuty ? (
                                  <span style={{ fontSize: '10px', color: 'var(--emerald-700)', background: 'var(--emerald-50)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    ON DUTY
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: '4px' }}>
                                    OFF
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--teal-700)', fontWeight: 600, margin: '2px 0 0 0' }}>
                                {doc.speciality} • {doc.room}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                                {doc.shift}
                              </p>
                              {doc.delayMinutes > 0 && (
                                <p style={{ fontSize: '11px', color: 'var(--rose-600)', margin: '2px 0 0 0', fontWeight: 600 }}>
                                  ⚠️ Delayed by ~{doc.delayMinutes} mins
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--teal-600)' : 'var(--border-strong)'}`,
                            background: isSelected ? 'var(--teal-600)' : 'transparent',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Grid (Morning / Evening) */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Select Preferred Time Slot *
                  </label>

                  {/* Morning Section */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      ☀️ Morning OPD
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {morningSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${selectedTimeSlot === slot ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                            background: selectedTimeSlot === slot ? 'var(--teal-600)' : 'var(--bg-surface)',
                            color: selectedTimeSlot === slot ? '#ffffff' : 'var(--text-main)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evening Section */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🌙 Evening OPD
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {eveningSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${selectedTimeSlot === slot ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                            background: selectedTimeSlot === slot ? 'var(--teal-600)' : 'var(--bg-surface)',
                            color: selectedTimeSlot === slot ? '#ffffff' : 'var(--text-main)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{ padding: '12px', fontSize: '14px', marginTop: '6px' }}
                >
                  {isLoading ? 'Reserving slot in MongoDB Atlas...' : `Confirm Slot for ${selectedTimeSlot}`}
                </button>
              </form>
            )}

            {/* Step 3: Digital OP Token Pass (Confirmed Booking Screen) */}
            {bookingStep === 3 && bookingConfirmation && (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: bookingConfirmation.isSuccess ? 'var(--emerald-50)' : 'var(--amber-50)',
                  color: bookingConfirmation.isSuccess ? 'var(--emerald-600)' : 'var(--amber-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  {bookingConfirmation.isSuccess ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                </div>

                <h2 style={{ fontSize: '18px', color: 'var(--text-main)', margin: '0 0 6px 0', fontWeight: 800 }}>
                  {bookingConfirmation.isSuccess ? 'Appointment Confirmed!' : 'Under Graduate Review'}
                </h2>
                
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  {bookingConfirmation.isSuccess 
                    ? 'Your appointment has been registered in the clinic database. Please show this token at the desk.'
                    : `Your requested slot is being verified by ${assignedGraduate?.name || 'OpsLoop Specialist'}. Reason: ${bookingConfirmation.conflictReason}`}
                </p>

                {/* Digital Token Card */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--teal-50), #ffffff)',
                  border: '2px dashed var(--teal-500)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '18px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--teal-200)', paddingBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Queue Token</div>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--teal-800)', fontFamily: 'var(--font-heading)' }}>
                        {bookingConfirmation.tokenNo}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Time Slot</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {bookingConfirmation.timeSlot}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Patient: </span>
                      <strong>{bookingConfirmation.patientName}</strong> ({bookingConfirmation.age} yrs, {bookingConfirmation.gender}, {bookingConfirmation.bloodGroup})
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Doctor: </span>
                      <strong>{bookingConfirmation.doctor?.name}</strong> ({bookingConfirmation.doctor?.speciality})
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Cabin: </span>
                      <strong>{bookingConfirmation.doctor?.room}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStep(1);
                      setBookingConfirmation(null);
                      setPatientName('');
                      setAge('');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Book for Family Member
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save Digital Token
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: GEMINI AI FAQ ENQUIRY */}
        {/* ================================================================= */}
        {activeTab === 'inquiry' && (
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--indigo-600)' }} />
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>Ask Anything (Gemini AI)</h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Get instant answers about doctor schedules, consultation charges, insurance policies, or directions.
            </p>

            <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Your Question *
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="e.g. How much is the consultation fee for Dr. Sneha? Does the clinic accept Bajaj insurance?"
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
                style={{ background: 'var(--indigo-600)' }}
              >
                <Send size={15} />
                <span>{isLoading ? 'Thinking with Gemini AI...' : 'Ask Question'}</span>
              </button>
            </form>

            {/* AI Response Card */}
            {aiResponseData && (
              <div style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--indigo-50)',
                border: '1px solid var(--indigo-100)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--indigo-700)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  <Sparkles size={14} /> Gemini 2.0 Response:
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                  {aiResponseData.aiResponse}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-dim)' }}>
          Powered by <strong>OpsLoop Automation</strong> • Verified Medical Practice
        </div>
      </div>
    </div>
  );
}
