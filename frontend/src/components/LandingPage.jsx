import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bot,
  QrCode,
  Building2,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Users,
  Zap,
  Lock,
  Layers,
  HeartPulse,
  Smartphone,
  Star,
  X,
  Stethoscope
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalAuthMode, setModalAuthMode] = useState('signin'); // 'signin' | 'register'
  const [loginRole, setLoginRole] = useState('operator');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Registration form states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+91 98450 12345');
  const [regSpeciality, setRegSpeciality] = useState('General Physician');
  const [regQualification, setRegQualification] = useState('MBBS, MD');

  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenLogin = (role, mode = 'signin') => {
    setLoginRole(role);
    setModalAuthMode(mode);
    if (role === 'operator') {
      setEmailInput('aarav.sharma@opsloop.internal');
      setPasswordInput('password123');
    } else if (role === 'owner') {
      setEmailInput('dr.rajesh@sanjeevani.com');
      setPasswordInput('password123');
    } else if (role === 'doctor') {
      setEmailInput('dr.sneha@sanjeevani.com');
      setPasswordInput('password123');
    } else {
      setEmailInput('admin@opsloop.com');
      setPasswordInput('password123');
    }
    setLoginError('');
    setShowLoginModal(true);
  };

  const handleEnterGraduateWorkspace = () => {
    if (isAuthenticated && (user.role === 'graduate' || user.role === 'admin')) {
      navigate('/operator');
    } else {
      handleOpenLogin('operator');
    }
  };

  const handleEnterOwnerCockpit = () => {
    if (isAuthenticated && (user.role === 'business_owner' || user.role === 'admin')) {
      navigate('/clinic');
    } else {
      handleOpenLogin('owner');
    }
  };

  const handleEnterDoctorDashboard = () => {
    if (isAuthenticated && (user.role === 'doctor' || user.role === 'admin')) {
      navigate('/doctor');
    } else {
      handleOpenLogin('doctor');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const loggedUser = await login(emailInput, passwordInput, loginRole);
      setShowLoginModal(false);
      if (loginRole === 'owner' || loggedUser.role === 'business_owner') {
        navigate('/clinic');
      } else if (loginRole === 'doctor' || loggedUser.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/operator');
      }
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const regUser = await register({
        name: regName,
        email: emailInput,
        password: passwordInput,
        role: loginRole === 'owner' ? 'business_owner' : (loginRole === 'operator' ? 'graduate' : 'doctor'),
        phone: regPhone,
        speciality: regSpeciality,
        qualification: regQualification
      });
      setShowLoginModal(false);
      if (regUser.role === 'doctor') {
        navigate('/doctor');
      } else if (regUser.role === 'business_owner') {
        navigate('/clinic');
      } else {
        navigate('/operator');
      }
    } catch (err) {
      setLoginError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const demoQrUrl = `${originUrl}/qr/sanjeevani-clinic`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">OpsLoop</span>
              <span className="text-[10px] font-extrabold tracking-wider uppercase bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
                AI PLATFORM
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#portals" className="hover:text-indigo-600 transition-colors">Portals &amp; Roles</a>
            <a href="#clinics" className="hover:text-indigo-600 transition-colors">Target MVP: Clinics</a>
            <a href="#architecture" className="hover:text-indigo-600 transition-colors">Architecture</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    if (user.role === 'doctor') navigate('/doctor');
                    else if (user.role === 'business_owner') navigate('/clinic');
                    else navigate('/operator');
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>My Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-slate-600 hover:text-rose-600 px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                {/* Doctor Login Button */}
                <button
                  onClick={() => handleOpenLogin('doctor')}
                  className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Doctor Login</span>
                </button>

                <button
                  onClick={() => handleOpenLogin('operator')}
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <a
                  href="#portals"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 hover:shadow transition-all flex items-center gap-1.5"
                >
                  <span>Launch Portals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-indigo-200/40 blur-[130px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-[320px] h-[320px] bg-violet-200/40 blur-[110px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-2xs text-xs font-semibold text-slate-700 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Business Automation meets Graduate Employment</span>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-violet-600" /> Powered by Gemini AI
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.2] max-w-4xl mx-auto">
            <span>Automate Local Businesses</span>{' '}
            <span className="block sm:inline-block mt-2 sm:mt-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 pb-1">
              with AI &amp; Certified Graduates
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed mt-5 mb-8">
            OpsLoop empowers clinics and local businesses with affordable workflow automation. Customers interact via a single QR scan, Gemini AI handles triage, and local graduates manage exceptions and operations.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 my-8 sm:my-10">
            <button
              onClick={handleEnterGraduateWorkspace}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>Graduate Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleEnterOwnerCockpit}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-slate-300/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Clinic Owner Cockpit</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleEnterDoctorDashboard}
              className="px-6 py-3.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-teal-200 hover:shadow-teal-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform" />
              <span>Doctor Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <Link
              to="/qr/sanjeevani-clinic"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all flex items-center gap-2 group"
            >
              <QrCode className="w-4 h-4 text-indigo-600 group-hover:rotate-6 transition-transform" />
              <span>Try Customer QR Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mt-8 pt-4">
            <div className="bg-white/90 backdrop-blur border border-slate-200/90 rounded-2xl p-5 text-center shadow-xs hover:border-indigo-200 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">4 Clinics</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Active Pilot Deployments</p>
            </div>
            <div className="bg-white/90 backdrop-blur border border-slate-200/90 rounded-2xl p-5 text-center shadow-xs hover:border-indigo-200 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">96.8%</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">AI Classification Accuracy</p>
            </div>
            <div className="bg-white/90 backdrop-blur border border-slate-200/90 rounded-2xl p-5 text-center shadow-xs hover:border-emerald-200 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">₹12,500/mo</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Avg Graduate Earnings</p>
            </div>
            <div className="bg-white/90 backdrop-blur border border-slate-200/90 rounded-2xl p-5 text-center shadow-xs hover:border-violet-200 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-violet-600">&lt; 1.2s</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Gemini Response Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* PORTALS & LOGIN GATEWAY SECTION */}
      <section id="portals" className="py-20 px-4 sm:px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200 mb-3.5">
              Role-Based Access
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Choose Your Workspace Portal
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              OpsLoop unifies the entire ecosystem under three authenticated interfaces and one public customer scan portal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* PORTAL 1: GRADUATE OPERATOR */}
            <div className="border-2 border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 via-white to-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative group">
              <div className="absolute top-5 right-5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs">
                  Primary Workspace
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 mb-5">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Graduate Operator</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  For certified graduates managing business automation workflows, resolving AI exception queues, and configuring clinic profiles.
                </p>

                <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Manage 4 assigned clinics</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Resolve Gemini triage conflicts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Generate &amp; download clinic QR codes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Track monthly performance &amp; payouts</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                <button
                  onClick={handleEnterGraduateWorkspace}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl text-center shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enter Graduate Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenLogin('operator')}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 cursor-pointer"
                >
                  Sign In with Credentials
                </button>
              </div>
            </div>

            {/* PORTAL 2: BUSINESS OWNER (CLINIC) */}
            <div className="border border-slate-200 hover:border-emerald-300 bg-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div className="absolute top-5 right-5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  Live Operations
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md mb-5">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Clinic / Business Owner</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  For clinic doctors and shop owners who need transparent, hands-off automation, live patient booking logs, and daily AI summaries.
                </p>

                <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live daily appointment calendar</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Doctor OPD timings &amp; slot limits</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily automated summary by Gemini</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct hotline to assigned graduate</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                <button
                  onClick={handleEnterOwnerCockpit}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl text-center shadow-md shadow-slate-300/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch Clinic Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenLogin('owner')}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors border border-emerald-200 cursor-pointer"
                >
                  Clinic Owner Sign In
                </button>
              </div>
            </div>

            {/* PORTAL 3: DOCTOR SPECIALIST COCKPIT */}
            <div className="border border-slate-200 hover:border-teal-300 bg-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div className="absolute top-5 right-5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
                  Clinical OPD
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md mb-5">
                  <Stethoscope className="w-6 h-6 text-teal-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Doctor Specialist</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  For consulting doctors to decide their available time slots, accept or decline patient slot requests, and manage active consultation queues.
                </p>

                <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Decide &amp; sync live time slots</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Accept/reject customer slot requests</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Live OPD token call &amp; consultations</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Broadcast delays &amp; duty status</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                <button
                  onClick={handleEnterDoctorDashboard}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl text-center shadow-md shadow-teal-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch Doctor Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenLogin('doctor')}
                  className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl transition-colors border border-teal-200 cursor-pointer"
                >
                  Doctor Sign In
                </button>
              </div>
            </div>

            {/* PORTAL 4: CENTRAL ADMIN */}
            <div className="border border-slate-200 hover:border-violet-300 bg-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div className="absolute top-5 right-5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200 shadow-2xs">
                  Platform Admin
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Central Platform Admin</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  For the OpsLoop executive team to onboard new businesses, certify graduates, monitor automation health, and disburse platform payouts.
                </p>

                <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Graduate onboarding &amp; verification</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Business subscription tiers (₹999 - ₹3,999)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Automation engine telemetry &amp; logs</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Platform revenue &amp; expense audit</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                <Link
                  to="/operator"
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold rounded-xl text-center shadow-md shadow-violet-200 hover:shadow-violet-300 transition-all flex items-center justify-center gap-2"
                >
                  <span>Admin Console Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleOpenLogin('admin')}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
                >
                  Admin Credentials Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200 mb-3">
              The OpsLoop Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              How the Complete Ecosystem Works
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              From a patient walking up to a clinic counter to an automated calendar booking verified by a human operator.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Patient Scans QR</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Zero app install. Scanning the clinic desk QR opens a lightweight, branded web page with doctors, fees, and slots.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-600 font-semibold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile-First Web App</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 font-extrabold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Gemini AI Triage</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Google Gemini parses the appointment request or natural symptoms into structured JSON with intent and confidence scores.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-violet-600 font-semibold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>Structured Extraction</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 font-extrabold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Slot Validation</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                MongoDB checks doctor schedule availability. If slot is open, an instant digital booking token is issued to the patient.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>No Hallucinated Slots</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 font-extrabold text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Graduate Escalation</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                If request is conflicting or confidence &lt; 80%, a task is generated in the operator queue for Aarav to resolve and confirm.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-700 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Human-In-The-Loop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SCAN DEMO SECTION */}
      <section id="clinics" className="py-20 px-4 sm:px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-5 max-w-lg">
            <span className="inline-block text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
              Live Interactive Test
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Scan with your phone to test the Patient Portal
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Point your smartphone camera at this QR code. It will instantly launch the live Sanjeevani Clinic patient booking and Gemini AI symptom assistant on your mobile browser.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                to="/qr/sanjeevani-clinic"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <span>Open Patient Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/clinic"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
              >
                View Clinic Cockpit
              </Link>
              <Link
                to="/operator"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
              >
                Operator Queue
              </Link>
            </div>
          </div>

          {/* QR Card */}
          <div className="bg-white p-7 rounded-2xl shadow-2xl text-center text-slate-900 border border-slate-100 shrink-0">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-inner mb-3">
              <QRCodeSVG value={demoQrUrl} size={170} level="H" />
            </div>
            <p className="text-sm font-bold text-slate-900">Sanjeevani Clinic</p>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5">Scan to Book Appointment</p>
            <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              /qr/sanjeevani-clinic
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 px-4 sm:px-6 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base">OpsLoop</span>
            <span className="text-slate-500">• AI-Powered Local Business Automation &amp; Graduate Employment</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/operator" className="hover:text-white transition-colors">Graduate Workspace</Link>
            <Link to="/clinic" className="hover:text-white transition-colors">Clinic Cockpit</Link>
            <Link to="/qr/sanjeevani-clinic" className="hover:text-white transition-colors">Customer QR Demo</Link>
            <a
              href="https://github.com/Arjun-un/hack_vvce.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>GitHub Repo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* LOGIN & REGISTRATION MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-slideUp my-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              {loginRole === 'operator' && <GraduationCap className="w-6 h-6 text-indigo-600" />}
              {loginRole === 'owner' && <Building2 className="w-6 h-6 text-emerald-600" />}
              {loginRole === 'doctor' && <Stethoscope className="w-6 h-6 text-teal-600" />}
              {loginRole === 'admin' && <ShieldCheck className="w-6 h-6 text-violet-600" />}
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              {modalAuthMode === 'signin' ? (
                <>
                  {loginRole === 'operator' && 'Graduate Operator Sign In'}
                  {loginRole === 'owner' && 'Clinic Owner Sign In'}
                  {loginRole === 'doctor' && 'Doctor Specialist Sign In'}
                  {loginRole === 'admin' && 'Central Admin Sign In'}
                </>
              ) : (
                'Create Your Account'
              )}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              {modalAuthMode === 'signin' 
                ? 'Authenticate your credentials to launch authorized workspace' 
                : 'Register for live access. A welcome confirmation email will be sent.'}
            </p>

            {/* Segmented Control Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200">
              <button
                type="button"
                onClick={() => { setModalAuthMode('signin'); setLoginError(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  modalAuthMode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setModalAuthMode('register'); setLoginError(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  modalAuthMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register New
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>{loginError}</span>
              </div>
            )}

            {modalAuthMode === 'signin' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email / ID</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* One-click preset switcher */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Switch Role Preset:
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('operator');
                        setEmailInput('aarav.sharma@opsloop.internal');
                        setPasswordInput('password123');
                        setLoginError('');
                      }}
                      className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                        loginRole === 'operator'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🎓 Graduate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('owner');
                        setEmailInput('dr.rajesh@sanjeevani.com');
                        setPasswordInput('password123');
                        setLoginError('');
                      }}
                      className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                        loginRole === 'owner'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏥 Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('doctor');
                        setEmailInput('dr.sneha@sanjeevani.com');
                        setPasswordInput('password123');
                        setLoginError('');
                      }}
                      className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                        loginRole === 'doctor'
                          ? 'bg-teal-50 text-teal-700 border-teal-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🩺 Doctor
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-colors mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In & Launch Workspace'}
                </button>
              </form>
            ) : (
              /* Register Form in Landing Modal */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Anita Desai / Aarav Verma"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="doctor">🩺 Doctor Specialist</option>
                    <option value="owner">🏥 Clinic Owner / Director</option>
                    <option value="operator">🎓 Graduate Operations Specialist</option>
                  </select>
                </div>

                {loginRole === 'doctor' && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-teal-50/50 border border-teal-100 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-800 mb-1">Speciality</label>
                      <input
                        type="text"
                        value={regSpeciality}
                        onChange={(e) => setRegSpeciality(e.target.value)}
                        placeholder="e.g. Neurologist"
                        className="w-full text-xs p-2 bg-white border border-teal-200 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-800 mb-1">Qualification</label>
                      <input
                        type="text"
                        value={regQualification}
                        onChange={(e) => setRegQualification(e.target.value)}
                        placeholder="e.g. MBBS, MD"
                        className="w-full text-xs p-2 bg-white border border-teal-200 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center gap-1.5 border border-slate-200">
                  <span className="text-indigo-600 font-bold">✉️ SMTP Dispatch:</span>
                  <span>Welcome email will be sent automatically to your inbox.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-indigo-200"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Register & Enter Workspace'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
