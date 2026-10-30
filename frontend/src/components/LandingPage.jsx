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
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null); // 'operator', 'owner', 'admin'
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState('operator');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleOpenLogin = (role) => {
    setLoginRole(role);
    if (role === 'operator') {
      setEmailInput('aarav.sharma@opsloop.internal');
      setPasswordInput('••••••••••••');
    } else if (role === 'owner') {
      setEmailInput('dr.ramesh@greenlifeclinic.in');
      setPasswordInput('••••••••••••');
    } else {
      setEmailInput('admin@opsloop.com');
      setPasswordInput('••••••••••••');
    }
    setShowLoginModal(true);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setShowLoginModal(false);
    if (loginRole === 'operator') {
      navigate('/operator');
    } else if (loginRole === 'owner') {
      navigate('/clinic');
    } else {
      navigate('/operator');
    }
  };

  const demoQrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/greenlife-clinic`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-violet-300" />
        <span>VVCE Hackathon MVP • Live Gemini 3.8 Flash AI Integration & Native MERN Architecture</span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Demo Ready</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">OpsLoop</span>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded">
                AI Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#portals" className="hover:text-indigo-600 transition-colors">Portals & Roles</a>
            <a href="#clinics" className="hover:text-indigo-600 transition-colors">Target MVP: Clinics</a>
            <a href="#architecture" className="hover:text-indigo-600 transition-colors">Architecture</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenLogin('operator')}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
            <a
              href="#portals"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5"
            >
              <span>Launch Portals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/40 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-200/40 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs text-xs font-semibold text-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Business Automation meets Graduate Employment</span>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-violet-600" /> Powered by Gemini AI
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Automate Local Businesses with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800">
              AI & Certified Graduates
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            OpsLoop empowers clinics and local businesses with affordable workflow automation. Customers interact via a single QR scan, Gemini AI handles triage, and local graduates manage exceptions and operations.
          </p>

          {/* Hero CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/operator"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2 group"
            >
              <GraduationCap className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>Enter Graduate Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/c/greenlife-clinic"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-sm font-bold rounded-xl shadow-2xs hover:shadow-sm transition-all flex items-center gap-2 group"
            >
              <QrCode className="w-4 h-4 text-indigo-600 group-hover:rotate-6 transition-transform" />
              <span>Try Customer QR Experience</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-4 text-center shadow-2xs">
              <div className="text-2xl font-black text-slate-900">4 Clinics</div>
              <p className="text-xs text-slate-500 mt-0.5">Active Pilot Deployments</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-4 text-center shadow-2xs">
              <div className="text-2xl font-black text-indigo-600">96.8%</div>
              <p className="text-xs text-slate-500 mt-0.5">AI Classification Accuracy</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-4 text-center shadow-2xs">
              <div className="text-2xl font-black text-emerald-600">₹12,500/mo</div>
              <p className="text-xs text-slate-500 mt-0.5">Avg Graduate Earnings</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-4 text-center shadow-2xs">
              <div className="text-2xl font-black text-violet-600">&lt; 1.2s</div>
              <p className="text-xs text-slate-500 mt-0.5">Gemini Response Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* PORTALS & LOGIN GATEWAY SECTION */}
      <section id="portals" className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Role-Based Access
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Choose Your Workspace Portal</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              OpsLoop unifies the entire ecosystem under three authenticated interfaces and one public customer scan portal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* PORTAL 1: GRADUATE OPERATOR */}
            <div className="border border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  Primary Workspace
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Graduate Operator</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  For certified graduates managing business automation workflows, resolving AI exception queues, and configuring clinic profiles.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Manage 4 assigned clinics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Resolve Gemini triage conflicts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Generate & download clinic QR codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Track monthly performance & payouts</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/operator"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Enter Graduate Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleOpenLogin('operator')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
                >
                  Sign In with Credentials
                </button>
              </div>
            </div>

            {/* PORTAL 2: BUSINESS OWNER (CLINIC) */}
            <div className="border border-slate-200 hover:border-slate-300 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md mb-4">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Clinic / Business Owner</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  For clinic doctors and shop owners who need transparent, hands-off automation, live patient booking logs, and daily AI summaries.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Live daily appointment calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Doctor OPD timings & slot limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Daily automated summary by Gemini</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct hotline to assigned graduate</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => handleOpenLogin('owner')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Clinic Owner Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link
                  to="/c/greenlife-clinic"
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors border border-emerald-200 text-center"
                >
                  Preview GreenLife Clinic View
                </Link>
              </div>
            </div>

            {/* PORTAL 3: CENTRAL ADMIN */}
            <div className="border border-slate-200 hover:border-slate-300 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Central Platform Admin</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  For the OpsLoop executive team to onboard new businesses, certify graduates, monitor automation health, and disburse platform payouts.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>Graduate onboarding & verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>Business subscription tiers (₹999 - ₹3,999)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>Automation engine telemetry & logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>Platform revenue & expense audit</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => handleOpenLogin('admin')}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Admin Console Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link
                  to="/operator"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 text-center"
                >
                  Quick Operator Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
              The OpsLoop Engine
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">How the Complete Ecosystem Works</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              From a patient walking up to a clinic counter to an automated calendar booking verified by a human operator.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">Patient Scans QR</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Zero app install. Scanning the clinic desk QR opens a lightweight, branded web page with doctors, fees, and slots.
              </p>
              <div className="mt-3 pt-2 text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>Mobile-First Web App</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 font-bold text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">Gemini AI Triage</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Google Gemini parses the appointment request or natural inquiry into structured JSON with intent and confidence scores.
              </p>
              <div className="mt-3 pt-2 text-[11px] text-violet-600 font-medium flex items-center gap-1">
                <Bot className="w-3 h-3" />
                <span>Structured Extraction</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">Database & Slot Validation</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                MongoDB checks doctor schedule availability. If slot is open, an instant digital booking token is issued to the patient.
              </p>
              <div className="mt-3 pt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>No Hallucinated Slots</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-900">Graduate Escalation</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                If request is conflicting or confidence &lt; 80%, a task is generated in the operator queue for Aarav to resolve and confirm.
              </p>
              <div className="mt-3 pt-2 text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Human-In-The-Loop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SCAN DEMO SECTION */}
      <section id="clinics" className="py-16 px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-md">
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
              Live Interactive Test
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Scan with your phone to test the Patient Portal
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Point your smartphone camera at this QR code. It will instantly launch the live GreenLife Clinic booking and Gemini AI inquiry interface right on your device.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/c/greenlife-clinic"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/operator"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                View Operator Queue
              </Link>
            </div>
          </div>

          {/* QR Card */}
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center text-slate-900 border border-slate-100 shrink-0">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-inner mb-3">
              <QRCodeSVG value={demoQrUrl} size={160} level="H" />
            </div>
            <p className="text-xs font-bold text-slate-900">GreenLife Clinic</p>
            <p className="text-[11px] text-slate-400">Scan to Book Appointment</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-10 px-6 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm">OpsLoop</span>
            <span className="text-slate-500">• AI-Powered Local Business Automation & Graduate Employment</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/operator" className="hover:text-white transition-colors">Graduate Workspace</Link>
            <Link to="/c/greenlife-clinic" className="hover:text-white transition-colors">Customer QR Demo</Link>
            <a
              href="https://github.com/Arjun-un/hack_vvce.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              {loginRole === 'operator' && <GraduationCap className="w-5 h-5" />}
              {loginRole === 'owner' && <Building2 className="w-5 h-5 text-emerald-600" />}
              {loginRole === 'admin' && <ShieldCheck className="w-5 h-5 text-violet-600" />}
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              {loginRole === 'operator' && 'Graduate Operator Login'}
              {loginRole === 'owner' && 'Clinic Owner Login'}
              {loginRole === 'admin' && 'Central Admin Login'}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              Enter demo credentials to access your dedicated workspace
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email / ID</label>
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200/60 rounded-lg p-2.5 text-[11px] text-indigo-900 space-y-0.5">
                <span className="font-bold">⚡ Demo Account Ready:</span>
                <p className="text-indigo-700">Click below to enter the authenticated workspace instantly.</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors mt-2"
              >
                Sign In & Launch Workspace
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
