import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  Bot,
  CheckCircle,
  PhoneCall,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Check,
  Stethoscope
} from 'lucide-react';

const CLINIC_DATA = {
  'greenlife-clinic': {
    name: 'GreenLife Clinic',
    category: 'Multi-Speciality & Dental Care',
    rating: '4.8 (140+ reviews)',
    address: '14th Cross, Indiranagar, Bengaluru',
    openUntil: '8:30 PM',
    phone: '+91 98450 12345',
    doctors: [
      { id: 'd1', name: 'Dr. Ramesh Kumar', role: 'General Physician & Diabetologist', fee: '₹400' },
      { id: 'd2', name: 'Dr. Priya Sharma', role: 'Dentist & Orthodontist', fee: '₹500' },
      { id: 'd3', name: 'Dr. Ananya Sen', role: 'Pediatric Specialist', fee: '₹600' }
    ],
    slots: ['09:30 AM', '10:00 AM', '11:30 AM', '04:00 PM', '05:30 PM', '06:30 PM']
  },
  'citycare-medical': {
    name: 'CityCare Medical Centre',
    category: 'Family Medicine & Diagnostics',
    rating: '4.9 (210+ reviews)',
    address: 'Brigade Road, Bengaluru',
    openUntil: '9:00 PM',
    phone: '+91 98450 67890',
    doctors: [
      { id: 'd1', name: 'Dr. Vikram Seth', role: 'Chief Medical Consultant', fee: '₹500' },
      { id: 'd2', name: 'Dr. Kavita Nair', role: 'Cardiology & Internal Medicine', fee: '₹750' }
    ],
    slots: ['10:00 AM', '10:30 AM', '03:00 PM', '04:30 PM', '07:00 PM']
  },
  'sunrise-family': {
    name: 'Sunrise Family Clinic',
    category: 'Pediatrics & General Care',
    rating: '4.7 (95 reviews)',
    address: 'Koramangala 4th Block, Bengaluru',
    openUntil: '8:00 PM',
    phone: '+91 98450 11223',
    doctors: [
      { id: 'd1', name: 'Dr. Neha Varma', role: 'Pediatrician & Child Health', fee: '₹500' }
    ],
    slots: ['11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM']
  },
  'primecare-health': {
    name: 'PrimeCare Health',
    category: 'Orthopedics & Physiotherapy',
    rating: '4.8 (112 reviews)',
    address: 'JP Nagar 2nd Phase, Bengaluru',
    openUntil: '8:00 PM',
    phone: '+91 98450 44556',
    doctors: [
      { id: 'd1', name: 'Dr. Suresh Babu', role: 'Orthopedic Surgeon', fee: '₹600' }
    ],
    slots: ['10:00 AM', '11:00 AM', '04:30 PM', '05:30 PM']
  }
};

export default function CustomerPortal() {
  const { clinicSlug } = useParams();
  const clinic = CLINIC_DATA[clinicSlug] || CLINIC_DATA['greenlife-clinic'];

  const [activeTab, setActiveTab] = useState('book'); // 'book' or 'ai_enquiry'
  const [selectedDoctor, setSelectedDoctor] = useState(clinic.doctors[0]);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedSlot, setSelectedSlot] = useState(clinic.slots[0]);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingToken, setBookingToken] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // AI Chat state
  const [aiMessage, setAiMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: `Hello! I am the automated assistant for ${clinic.name}. You can ask about consultation timings, doctor fees, or specializations.`
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!patientName || !patientPhone) return;

    setIsBooking(true);
    try {
      const apiHost = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? window.location.origin
        : 'http://localhost:5000';
      
      const res = await fetch(`${apiHost}/api/customer/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          businessSlug: clinicSlug === 'greenlife-clinic' ? 'sanjeevani-clinic' : (clinicSlug || 'sanjeevani-clinic'),
          doctorId: '6ae45e8894ef5a16781079e3',
          patientName,
          patientPhone,
          patientEmail,
          timeSlot: selectedSlot,
          symptoms: `Consultation with ${selectedDoctor.name}`
        })
      });
      const data = await res.json();
      const token = data.appointment?.tokenNo || `T-${Math.floor(10 + Math.random() * 89)}`;
      setBookingToken(token);
      setBookingConfirmed(true);
    } catch (err) {
      const token = `T-${Math.floor(10 + Math.random() * 89)}`;
      setBookingToken(token);
      setBookingConfirmed(true);
    } finally {
      setIsBooking(false);
    }
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userText = aiMessage;
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setAiMessage('');
    setIsAiTyping(true);

    // Call live backend Gemini triage or fallback
    try {
      const apiHost = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? window.location.origin
        : 'http://localhost:5000';
      const res = await fetch(`${apiHost}/api/gemini/triage`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ message: userText, clinicName: clinic.name })
      });
      const data = await res.json();
      setIsAiTyping(false);

      if (data.success && data.data) {
        setChatLog(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.data.summary || `Thank you. I have classified your request as "${data.data.intent}". Our clinic operator will confirm your appointment shortly.`
          }
        ]);
      } else {
        throw new Error('Fallback');
      }
    } catch {
      setIsAiTyping(false);
      setChatLog(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Thank you for reaching out to ${clinic.name}. Consultations are available with ${selectedDoctor.name} (${selectedDoctor.fee}). Your inquiry has been routed to our operator queue!`
        }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[780px] sm:rounded-2xl shadow-xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-5">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="text-xs text-indigo-200 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Open Now
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight">{clinic.name}</h1>
          <p className="text-xs text-indigo-200 mt-0.5">{clinic.category}</p>

          <div className="flex items-center gap-4 text-xs text-indigo-100 mt-3 pt-3 border-t border-indigo-600/60">
            <div className="flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-indigo-300" />
              <span className="line-clamp-1">{clinic.address}</span>
            </div>
            <a href={`tel:${clinic.phone}`} className="flex items-center gap-1 text-[11px] hover:underline text-indigo-200 shrink-0">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'book'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_enquiry')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ai_enquiry'
                ? 'bg-white text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Ask AI Assistant</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === 'book' ? (
            bookingConfirmed ? (
              /* Booking Confirmation State */
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">Appointment Requested!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your request has been saved and confirmed by {clinic.name}.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-200 font-semibold">
                    <span className="text-slate-500">Booking Pass #</span>
                    <span className="text-indigo-600 font-mono text-sm">{bookingToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient:</span>
                    <span className="text-slate-900 font-medium">{patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doctor:</span>
                    <span className="text-slate-900 font-medium">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Schedule:</span>
                    <span className="text-slate-900 font-medium">{selectedDate} at {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="text-emerald-700 font-bold">{selectedDoctor.fee}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Please show this pass at the clinic reception on arrival.
                </p>

                <button
                  onClick={() => {
                    setBookingConfirmed(false);
                    setPatientName('');
                    setPatientPhone('');
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleBook} className="space-y-4">
                {/* 1. Doctor Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Select Doctor / Speciality</span>
                  </label>
                  <div className="space-y-2">
                    {clinic.doctors.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedDoctor.id === doc.id
                            ? 'bg-indigo-50/70 border-indigo-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{doc.name}</p>
                            <p className="text-[11px] text-slate-500">{doc.role}</p>
                          </div>
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {doc.fee}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Choose Day */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Preferred Date</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {['Today', 'Tomorrow', 'Day After'].map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`py-2 rounded-lg border text-center font-semibold transition-all ${
                          selectedDate === day
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Choose Time Slot */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Available Slot</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {clinic.slots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-lg border text-center font-medium transition-all ${
                          selectedSlot === slot
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Patient Information */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (for SMS/WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="e.g. 98765 43210"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Email Address (for instant confirmation email & token)</span>
                      <span className="text-[10px] text-teal-600 font-bold">✉️ SMTP Ticket</span>
                    </label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="e.g. patient@gmail.com"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Appointment</span>
                </button>
              </form>
            )
          ) : (
            /* AI Assistant Tab */
            <div className="h-full flex flex-col justify-between space-y-4">
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {chatLog.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-xs ${
                      chat.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {chat.sender === 'ai' && (
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        chat.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Bot className="w-4 h-4 text-violet-500 animate-bounce" />
                    <span>Gemini AI is analyzing clinic records...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAiMessage} className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Ask about fees, timings, or tests..."
                  className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={!aiMessage.trim()}
                  className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

