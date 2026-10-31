import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { initialClinicData } from '../data/mockClinicData';
import { 
  getCustomerClinicInfo, 
  bookCustomerSlot, 
  sendCustomerEnquiry, 
  triageSymptomsWithAi, 
  getCustomerAppointment,
  sendNetworkFailureAlert,
  holdSlotApi,
  releaseSlotApi
} from '../services/api';
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
  Share2,
  WifiOff,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Smartphone,
  Lock,
  Unlock,
  Timer
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
  const [patientEmail, setPatientEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [symptoms, setSymptoms] = useState('');

  // Doctor & Slot Selection
  const [selectedSpeciality, setSelectedSpeciality] = useState('all');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('11:00 AM');

  // Customer Persistent Session & 20-min Slot Hold State
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('opsloop_customer_session');
      if (!sid) {
        sid = 'cust_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('opsloop_customer_session', sid);
      }
      return sid;
    }
    return 'cust_' + Date.now();
  });
  const [activeSlotLocks, setActiveSlotLocks] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [slotHoldNotice, setSlotHoldNotice] = useState('');
  const [isHoldingSlot, setIsHoldingSlot] = useState(false);

  // AI Inquiry State
  const [inquiryText, setInquiryText] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [aiResponseData, setAiResponseData] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAnalyzingSymptoms, setIsAnalyzingSymptoms] = useState(false);

  // Network Drop & Hospital Alert State
  const [networkDropState, setNetworkDropState] = useState(null);
  const [isHospitalNotified, setIsHospitalNotified] = useState(false);

  // Update clock every second for live countdown
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
          if (data.activeSlotLocks) {
            setActiveSlotLocks(data.activeSlotLocks);
          }
        }
      } catch (e) {
        console.warn('Backend API unavailable, using mock data:', e.message);
        setSelectedDoctorId(initialClinicData.doctors[0].id);
      }
    }
    fetchClinicData();

    // Auto-poll active locks every 8 seconds for real-time unblock / block sync
    const interval = setInterval(async () => {
      try {
        const data = await getCustomerClinicInfo(clinicSlug);
        if (data?.activeSlotLocks) {
          setActiveSlotLocks(data.activeSlotLocks);
        }
      } catch (e) {}
    }, 8000);

    return () => clearInterval(interval);
  }, [clinicSlug]);

  // Helper to determine lock status for any slot
  const getSlotLockStatus = (slot) => {
    if (!selectedDoctorId) return null;
    const lock = activeSlotLocks.find(l => {
      const lockDocId = String(l.doctorId?._id || l.doctorId);
      return lockDocId === String(selectedDoctorId) && l.timeSlot?.trim() === slot.trim();
    });

    if (!lock) return null;

    const expiresAtMs = new Date(lock.expiresAt).getTime();
    const remainingMs = expiresAtMs - currentTime;
    if (remainingMs <= 0) return null; // 20-min window expired -> unblocked for bookings!

    const remainingSecs = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    const formattedTimer = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const isOwnLock = lock.sessionId === sessionId;

    return {
      ...lock,
      isOwnLock,
      remainingSecs,
      remainingMins: Math.ceil(remainingSecs / 60),
      formattedTimer
    };
  };

  // Handler: Selecting a slot acquires a 20-minute reservation lock
  const handleSelectSlot = async (slot) => {
    const lockStatus = getSlotLockStatus(slot);

    // If locked by another customer or clinic desk
    if (lockStatus && !lockStatus.isOwnLock) {
      setSlotHoldNotice(`🔒 Slot ${slot} was chosen and is blocked for the next ${lockStatus.remainingMins} minutes. It will automatically unblock after 20 minutes if not booked. Please choose an open slot.`);
      return;
    }

    setSlotHoldNotice('');
    const previousSlot = selectedTimeSlot;
    setSelectedTimeSlot(slot);

    // Release old held slot if changing choice
    if (previousSlot && previousSlot !== slot) {
      releaseSlotApi({
        doctorId: selectedDoctorId,
        timeSlot: previousSlot,
        sessionId
      }).catch(() => {});
    }

    // Acquire 20-min lock
    setIsHoldingSlot(true);
    try {
      const res = await holdSlotApi({
        businessSlug: clinicSlug,
        doctorId: selectedDoctorId,
        timeSlot: slot,
        sessionId,
        patientName,
        patientPhone: phone
      });

      if (res?.success) {
        const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
        setActiveSlotLocks(prev => [
          ...prev.filter(l => !(String(l.doctorId?._id || l.doctorId) === String(selectedDoctorId) && l.timeSlot === slot)),
          {
            doctorId: selectedDoctorId,
            timeSlot: slot,
            sessionId,
            expiresAt
          }
        ]);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setSlotHoldNotice(err.response?.data?.message || `Slot ${slot} was just blocked by another user.`);
      }
    } finally {
      setIsHoldingSlot(false);
    }
  };

  // Real-time polling when booking is under Graduate Review
  useEffect(() => {
    const aptId = bookingConfirmation?.appointment?._id;
    if (bookingStep === 3 && aptId && !bookingConfirmation.isSuccess) {
      const interval = setInterval(async () => {
        try {
          const res = await getCustomerAppointment(aptId);
          if (res && res.appointment && res.appointment.status === 'confirmed') {
            setBookingConfirmation(prev => ({
              ...prev,
              isSuccess: true,
              appointment: res.appointment,
              timeSlot: res.appointment.timeSlot,
              doctor: res.appointment.doctorId || prev.doctor,
              graduateResolutionNotes: res.appointment.graduateResolutionNotes || 'Approved by OpsLoop Specialist',
              conflictReason: null
            }));
            clearInterval(interval);
          }
        } catch (e) {
          // ignore transient poll errors
        }
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [bookingStep, bookingConfirmation?.appointment?._id, bookingConfirmation?.isSuccess]);

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

  // Available Time Slots dynamically decided by the Doctor
  const doctorSlots = (selectedDoctor && Array.isArray(selectedDoctor.timeSlots) && selectedDoctor.timeSlots.length > 0)
    ? selectedDoctor.timeSlots
    : ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'];

  const morningSlots = doctorSlots.filter(s => s.toUpperCase().includes('AM') || s.startsWith('12:') || s.startsWith('01:'));
  const eveningSlots = doctorSlots.filter(s => s.toUpperCase().includes('PM') && !s.startsWith('12:') && !s.startsWith('01:'));

  // Ensure default slot matches an available doctor slot
  useEffect(() => {
    if (doctorSlots.length > 0 && !doctorSlots.includes(selectedTimeSlot)) {
      setSelectedTimeSlot(doctorSlots[0]);
    }
  }, [selectedDoctorId, doctorSlots]);

  // Handle Gemini AI Symptom Triage & Doctor Recommendation
  const handleAnalyzeSymptomsWithAi = async () => {
    if (!symptoms.trim()) {
      alert('Please enter symptoms first so Gemini AI can analyze them.');
      return;
    }

    setIsAnalyzingSymptoms(true);
    try {
      const res = await triageSymptomsWithAi({
        businessSlug: clinicSlug,
        symptoms: symptoms.trim(),
        age: age ? Number(age) : undefined,
        gender
      });

      if (res && res.recommendation) {
        setAiRecommendation(res.recommendation);
        // Pre-select recommended doctor in Step 2
        const recId = String(res.recommendation.recommendedDoctorId || '');
        const recName = (res.recommendation.recommendedDoctorName || '').toLowerCase();

        const match = doctors.find(d => 
          (recId && (String(d._id) === recId || String(d.id) === recId)) ||
          (recName && d.name.toLowerCase().includes(recName))
        );

        if (match) {
          setSelectedDoctorId(match._id || match.id);
        }
      }
    } catch (err) {
      console.warn('Gemini symptom triage notice:', err);
    } finally {
      setIsAnalyzingSymptoms(false);
    }
  };

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
    if (!patientEmail.trim()) {
      alert('Please enter your email address to receive your confirmation pass and token.');
      return;
    }
    if (!age || age <= 0) {
      alert('Please enter valid patient age');
      return;
    }

    setBookingStep(2);

    // If symptoms are filled and not yet triaged, run fast Gemini triage
    if (symptoms.trim() && !aiRecommendation) {
      handleAnalyzeSymptomsWithAi();
    }
  };

  // Submit Complete Booking to MongoDB
  const handleFinalBooking = async (e, isAutoRetry = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedDoctorId) {
      alert('Please select a doctor');
      return;
    }

    setIsLoading(true);

    const payload = {
      businessSlug: clinicSlug,
      doctorId: selectedDoctorId,
      patientName: patientName.trim(),
      patientPhone: phone.trim(),
      patientEmail: patientEmail.trim(),
      age: Number(age),
      gender,
      bloodGroup,
      timeSlot: selectedTimeSlot,
      sessionId,
      symptoms: symptoms.trim() || 'General Consultation'
    };

    try {
      // Check if browser is currently offline
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        throw new Error('Device is currently offline (No active internet connection)');
      }

      const res = await bookCustomerSlot(payload);

      setNetworkDropState(null);
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
      console.warn('Booking network drop detected:', err.message);

      const dropDetails = {
        hasDropped: true,
        patientName: patientName.trim(),
        patientPhone: phone.trim(),
        age: Number(age),
        gender,
        bloodGroup,
        doctorName: selectedDoctor?.name || 'Doctor Specialist',
        doctorId: selectedDoctorId,
        timeSlot: selectedTimeSlot,
        symptoms: symptoms.trim() || 'General Consultation',
        clinicName: clinic?.name || 'Sanjeevani Multispeciality Clinic',
        clinicPhone: clinic?.phone || '+91 98450 12345',
        errorReason: err.message || 'Client network disconnect or request timeout',
        droppedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setNetworkDropState(dropDetails);

      // Attempt immediate background alert dispatch to Hospital & Graduate
      try {
        sendNetworkFailureAlert({
          businessSlug: clinicSlug,
          doctorId: selectedDoctorId,
          doctorName: selectedDoctor?.name,
          patientName: patientName.trim(),
          patientPhone: phone.trim(),
          age: Number(age),
          gender,
          bloodGroup,
          timeSlot: selectedTimeSlot,
          symptoms: symptoms.trim() || 'General Consultation',
          errorDetails: err.message || 'Client network disconnect or request timeout'
        }).then(() => {
          setIsHospitalNotified(true);
        }).catch(() => {});
      } catch (alertErr) {}
    } finally {
      setIsLoading(false);
    }
  };

  // Re-attempt online submission automatically when internet signal returns
  useEffect(() => {
    const handleOnline = () => {
      if (networkDropState?.hasDropped && !bookingConfirmation) {
        handleFinalBooking(null, true);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [networkDropState, bookingConfirmation, selectedDoctorId, selectedTimeSlot]);

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

                {/* Email Address for Confirmation Pass */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Email Address * (for confirmation pass & token)</span>
                    <span style={{ fontSize: '11px', color: 'var(--teal-600)', fontWeight: 600 }}>✉️ Direct SMTP Ticket</span>
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={handleAnalyzeSymptomsWithAi}
                      disabled={isAnalyzingSymptoms || !symptoms.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                        border: '1px solid #c7d2fe',
                        color: '#4338ca',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: symptoms.trim() ? 'pointer' : 'not-allowed',
                        opacity: symptoms.trim() ? 1 : 0.6,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Sparkles size={13} style={{ color: '#6366f1' }} />
                      <span>{isAnalyzingSymptoms ? 'Gemini AI is analyzing symptoms...' : '⚡ Ask Gemini AI to Recommend Doctor'}</span>
                    </button>
                  </div>

                  {aiRecommendation && (
                    <div style={{
                      marginTop: '10px',
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 100%)',
                      border: '1px solid #c7d2fe',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4338ca', fontWeight: 700, fontSize: '12px' }}>
                        <Sparkles size={14} style={{ color: '#6366f1' }} /> Gemini AI Clinical Recommendation:
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1e293b', lineHeight: 1.45 }}>
                        {aiRecommendation.reason}
                      </p>
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#0d9488', fontWeight: 700 }}>
                        👉 Recommended: <strong>{aiRecommendation.recommendedDoctorName}</strong> ({aiRecommendation.speciality})
                      </div>
                    </div>
                  )}
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

                {/* Gemini AI Clinical Guidance Banner */}
                {aiRecommendation && (
                  <div style={{
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 100%)',
                    border: '1px solid #c7d2fe',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <Sparkles size={16} style={{ color: '#4338ca', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#4338ca' }}>
                        Gemini AI Suggestion for "{symptoms}":
                      </div>
                      <p style={{ fontSize: '12px', color: '#1e293b', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                        {aiRecommendation.reason}
                      </p>
                      <div style={{ marginTop: '5px', fontSize: '11.5px', color: '#0d9488', fontWeight: 700 }}>
                        ✓ Recommended Specialist: <strong>{aiRecommendation.recommendedDoctorName}</strong> ({aiRecommendation.speciality})
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Time Slots Grid (Morning / Evening) with 20-Minute Hold Policy */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Select Preferred Time Slot *
                    </label>
                    <span style={{ fontSize: '10.5px', color: 'var(--teal-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Timer size={12} /> 20-Min Hold Rule
                    </span>
                  </div>

                  {/* 20-Minute Hold Policy Explanation Chip */}
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--teal-50)',
                    border: '1px solid var(--teal-200)',
                    fontSize: '11.5px',
                    color: 'var(--teal-900)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ShieldCheck size={14} style={{ color: 'var(--teal-600)', flexShrink: 0 }} />
                    <span>
                      Choosing a slot reserves it for <strong>20 minutes</strong> exclusively for you. Any slot taken by others remains blocked until the 20 minutes expire.
                    </span>
                  </div>

                  {/* Slot Hold Notice Alert */}
                  {slotHoldNotice && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#9f1239',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <Lock size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{slotHoldNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSlotHoldNotice('')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9f1239', fontWeight: 800, padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Morning Section */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      ☀️ Morning OPD
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {morningSlots.map(slot => {
                        const lockStatus = getSlotLockStatus(slot);
                        const isLockedByOther = lockStatus && !lockStatus.isOwnLock;
                        const isLockedBySelf = lockStatus && lockStatus.isOwnLock;
                        const isSelected = selectedTimeSlot === slot;

                        if (isLockedByOther) {
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              style={{
                                padding: '6px 4px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px dashed #f87171',
                                background: '#fef2f2',
                                color: '#991b1b',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                textAlign: 'center',
                                opacity: 0.85
                              }}
                              title={`Slot is blocked for the next ${lockStatus.remainingMins} minutes`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <Lock size={10} /> {slot}
                              </div>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', display: 'block', marginTop: '2px' }}>
                                Held ({lockStatus.remainingMins}m left)
                              </span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleSelectSlot(slot)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: 'var(--radius-sm)',
                              border: `1.5px solid ${isSelected ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                              background: isSelected ? 'var(--teal-600)' : 'var(--bg-surface)',
                              color: isSelected ? '#ffffff' : 'var(--text-main)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div>{slot}</div>
                            {isLockedBySelf && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#a7f3d0', display: 'block', marginTop: '2px' }}>
                                🔒 Held: {lockStatus.formattedTimer}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evening Section */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🌙 Evening OPD
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {eveningSlots.map(slot => {
                        const lockStatus = getSlotLockStatus(slot);
                        const isLockedByOther = lockStatus && !lockStatus.isOwnLock;
                        const isLockedBySelf = lockStatus && lockStatus.isOwnLock;
                        const isSelected = selectedTimeSlot === slot;

                        if (isLockedByOther) {
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              style={{
                                padding: '6px 4px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px dashed #f87171',
                                background: '#fef2f2',
                                color: '#991b1b',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                textAlign: 'center',
                                opacity: 0.85
                              }}
                              title={`Slot is blocked for the next ${lockStatus.remainingMins} minutes`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <Lock size={10} /> {slot}
                              </div>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', display: 'block', marginTop: '2px' }}>
                                Held ({lockStatus.remainingMins}m left)
                              </span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleSelectSlot(slot)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: 'var(--radius-sm)',
                              border: `1.5px solid ${isSelected ? 'var(--teal-600)' : 'var(--border-subtle)'}`,
                              background: isSelected ? 'var(--teal-600)' : 'var(--bg-surface)',
                              color: isSelected ? '#ffffff' : 'var(--text-main)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div>{slot}</div>
                            {isLockedBySelf && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#a7f3d0', display: 'block', marginTop: '2px' }}>
                                🔒 Held: {lockStatus.formattedTimer}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Network Drop / Connection Issue Emergency Dispatcher Banner */}
                {networkDropState?.hasDropped && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    border: '2px solid #f59e0b',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#d97706',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <WifiOff size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#92400e' }}>
                          Network Connection Issue Detected
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#b45309', lineHeight: 1.35 }}>
                          Your internet dropped while transmitting your booking. Don't worry! We've preserved all your details. Choose an option below to notify {clinic?.name || 'the hospital'} immediately!
                        </p>
                      </div>
                    </div>

                    {/* Hospital Notification Status Pill */}
                    <div style={{
                      padding: '8px 12px',
                      background: '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #fcd34d',
                      fontSize: '11.5px',
                      color: isHospitalNotified ? '#047857' : '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isHospitalNotified ? '#10b981' : '#f59e0b',
                        display: 'inline-block'
                      }} />
                      <span>
                        {isHospitalNotified 
                          ? '✓ Hospital reception received the background alert! Your slot is logged at desk.'
                          : 'Waiting for connection recovery. Use direct SMS/Call below for instant 100% offline confirmation.'}
                      </span>
                    </div>

                    {/* 3 Direct Hospital Dispatch Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {/* Option A: Direct SMS (100% Offline via GSM Cellular) */}
                      {(() => {
                        const cleanPhone = (clinic?.phone || '+919845012345').replace(/[^0-9+]/g, '');
                        const smsBody = encodeURIComponent(
                          `URGENT OPD BOOKING (Network Drop Alert):\nPatient: ${patientName} (${phone})\nDoctor: ${selectedDoctor?.name}\nSlot: ${selectedTimeSlot}\nSymptoms: ${symptoms}\nOnline booking timed out due to poor network. Please confirm my slot manually.`
                        );

                        return (
                          <a
                            href={`sms:${cleanPhone}?body=${smsBody}`}
                            className="btn btn-sm"
                            style={{
                              textDecoration: 'none',
                              background: '#ffffff',
                              color: '#92400e',
                              border: '1.5px solid #d97706',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              padding: '8px'
                            }}
                          >
                            <Smartphone size={14} color="#d97706" />
                            <span>1-Tap Direct SMS</span>
                          </a>
                        );
                      })()}

                      {/* Option B: WhatsApp to Hospital */}
                      {(() => {
                        const cleanPhone = (clinic?.phone || '9845012345').replace(/[^0-9]/g, '');
                        const waText = encodeURIComponent(
                          `*⚠️ URGENT PATIENT BOOKING - NETWORK DROP ALERT*\n\nHello ${clinic?.name || 'Hospital Reception'},\nMy online booking timed out due to poor internet.\n\n*Patient:* ${patientName}\n*Phone:* ${phone}\n*Age/Gender:* ${age} yrs, ${gender}\n*Doctor:* ${selectedDoctor?.name}\n*Requested Slot:* ${selectedTimeSlot}\n*Symptoms:* ${symptoms}\n\nPlease confirm my slot manually at reception.`
                        );

                        return (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            style={{
                              textDecoration: 'none',
                              background: '#25D366',
                              color: '#ffffff',
                              border: '1px solid #1da851',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              padding: '8px'
                            }}
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp Desk</span>
                          </a>
                        );
                      })()}

                      {/* Option C: Direct Phone Call */}
                      {(() => {
                        const cleanPhone = (clinic?.phone || '+919845012345').replace(/[^0-9+]/g, '');
                        return (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="btn btn-sm"
                            style={{
                              textDecoration: 'none',
                              background: '#ffffff',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '8px'
                            }}
                          >
                            <PhoneCall size={14} color="#0d9488" />
                            <span>Call Reception</span>
                          </a>
                        );
                      })()}
                    </div>

                    {/* Retry Online Submission button */}
                    <button
                      type="button"
                      onClick={(e) => handleFinalBooking(e, true)}
                      disabled={isLoading}
                      className="btn btn-secondary btn-sm"
                      style={{
                        background: '#ffffff',
                        borderColor: '#f59e0b',
                        color: '#92400e',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                      <span>{isLoading ? 'Re-attempting Transmission...' : '🔄 Retry Online Submission Now'}</span>
                    </button>
                  </div>
                )}

                {/* Final Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{ padding: '12px', fontSize: '14px', marginTop: '6px' }}
                >
                  {isLoading ? 'Transmitting slot to clinic...' : `Confirm Slot for ${selectedTimeSlot}`}
                </button>
              </form>
            )}

            {/* Step 3: Digital OP Token Pass (Confirmed Booking Screen / Live Review) */}
            {bookingStep === 3 && bookingConfirmation && (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: bookingConfirmation.isSuccess ? 'var(--emerald-50)' : '#fef3c7',
                  color: bookingConfirmation.isSuccess ? 'var(--emerald-600)' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  {bookingConfirmation.isSuccess ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                </div>

                <h2 style={{ fontSize: '18px', color: 'var(--text-main)', margin: '0 0 6px 0', fontWeight: 800 }}>
                  {bookingConfirmation.isSuccess ? 'Appointment Confirmed!' : 'Slot Coordination in Progress'}
                </h2>
                
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  {bookingConfirmation.isSuccess 
                    ? 'Your appointment has been registered in the clinic database. Please show this token at the desk upon arrival.'
                    : `Your requested slot is being verified and adjusted in real-time by ${assignedGraduate?.name || 'Arjun Mehta'} (OpsLoop Certified Specialist).`}
                </p>

                {/* Conflict Notice if under review */}
                {!bookingConfirmation.isSuccess && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 700, fontSize: '12px', marginBottom: '3px' }}>
                      <AlertTriangle size={14} /> Schedule Conflict Detected:
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
                      {bookingConfirmation.conflictReason || 'Doctor slot overlap or clinic schedule adjustment.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: '#047857', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      <span>Live Auto-Syncing: This screen will automatically confirm when resolved!</span>
                    </div>
                  </div>
                )}

                {/* Specialist Resolution Summary (When Resolved by Graduate) */}
                {bookingConfirmation.isSuccess && (bookingConfirmation.graduateResolutionNotes || bookingConfirmation.appointment?.graduateResolutionNotes) && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, fontSize: '12px', marginBottom: '3px' }}>
                      <ShieldCheck size={15} /> OpsLoop Specialist Resolution Summary:
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#166534', lineHeight: 1.45 }}>
                      {bookingConfirmation.graduateResolutionNotes || bookingConfirmation.appointment?.graduateResolutionNotes}
                    </p>
                  </div>
                )}

                {/* Digital Token Card */}
                <div style={{
                  background: bookingConfirmation.isSuccess ? 'linear-gradient(135deg, var(--teal-50), #ffffff)' : 'linear-gradient(135deg, #fffbeb, #ffffff)',
                  border: `2px dashed ${bookingConfirmation.isSuccess ? 'var(--teal-500)' : '#f59e0b'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '18px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Queue Token</div>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: bookingConfirmation.isSuccess ? 'var(--teal-800)' : '#b45309', fontFamily: 'var(--font-heading)' }}>
                        {bookingConfirmation.tokenNo}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {bookingConfirmation.isSuccess ? 'Confirmed Slot' : 'Requested Slot'}
                      </div>
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
                      <strong>{bookingConfirmation.doctor?.room || 'Consultation Cabin'}</strong>
                    </div>
                  </div>
                </div>

                {patientEmail && bookingConfirmation.isSuccess && (
                  <div style={{
                    padding: '10px 14px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: 600,
                    margin: '16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                    <span>✉️ Official confirmation pass dispatched to <strong>{patientEmail}</strong></span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStep(1);
                      setBookingConfirmation(null);
                      setPatientName('');
                      setAge('');
                      setSymptoms('');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Book for Family Member
                  </button>
                  {bookingConfirmation.isSuccess && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      Save Digital Token
                    </button>
                  )}
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

            {/* Quick Suggestion Chips */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Quick Frequently Asked Questions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { label: '⏰ Clinic Timings', q: 'What are the OPD clinic timings and hours today?' },
                  { label: '💵 Consultation Fees', q: 'What is the doctor consultation fee structure?' },
                  { label: '👶 Pediatrician Available?', q: 'Is pediatrician Dr. Sneha Patil available for child checkup?' },
                  { label: '❤️ Heart Specialist', q: 'Is Dr. Ramesh Rao available for cardiology consultation?' }
                ].map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setInquiryText(chip.q);
                    }}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

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
                <span>{isLoading ? 'Thinking with Gemini AI...' : 'Ask Gemini Assistant'}</span>
              </button>
            </form>

            {/* AI Response Card */}
            {aiResponseData && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 100%)',
                border: '1px solid #c7d2fe',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4338ca', fontWeight: 700, fontSize: '13px' }}>
                    <Sparkles size={15} style={{ color: '#6366f1' }} /> Gemini AI Assistant
                  </div>
                  {aiResponseData.aiConfidence && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {Math.round(aiResponseData.aiConfidence * 100)}% Confidence
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#1e293b', margin: 0, lineHeight: 1.55 }}>
                  {aiResponseData.aiResponse}
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('booking')}
                    style={{
                      background: 'var(--teal-600)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>📅 Book Doctor Slot Now</span>
                  </button>
                </div>
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
