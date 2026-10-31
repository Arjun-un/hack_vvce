import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Building2, 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Stethoscope
} from 'lucide-react';

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requiredRoleName = 'Authorized Specialist',
  roleHint = 'operator'
}) {
  const { user, isAuthenticated, isAuthorized, login, register, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState('signin');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    if (roleHint === 'doctor') return 'dr.sneha@sanjeevani.com';
    return roleHint === 'owner' ? 'dr.rajesh@sanjeevani.com' : 'aarav.sharma@opsloop.internal';
  });
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('+91 98450 12345');
  const [speciality, setSpeciality] = useState('Consultant Physician & Surgeon');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [registerRole, setRegisterRole] = useState(() => {
    if (roleHint === 'doctor') return 'doctor';
    return roleHint === 'owner' ? 'business_owner' : 'graduate';
  });

  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset helper for sign-in
  const selectPreset = (type) => {
    if (type === 'operator') {
      setEmail('aarav.sharma@opsloop.internal');
      setPassword('password123');
    } else if (type === 'doctor') {
      setEmail('dr.sneha@sanjeevani.com');
      setPassword('password123');
    } else {
      setEmail('dr.rajesh@sanjeevani.com');
      setPassword('password123');
    }
    setAuthError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');
    setSuccessMsg('');

    try {
      await login(email, password, roleHint);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');
    setSuccessMsg('');

    try {
      const regUser = await register({
        name,
        email,
        password,
        role: registerRole,
        phone,
        speciality,
        qualification
      });
      setSuccessMsg(`Welcome ${regUser.name}! Welcome email dispatched to ${regUser.email}.`);
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Activity className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-semibold uppercase tracking-wider">Verifying Security Credentials...</p>
      </div>
    );
  }

  // 1. Unauthenticated -> Challenge Screen with Sign In / Register toggle
  if (!isAuthenticated) {
    const isOwnerWorkspace = roleHint === 'owner' || allowedRoles.includes('business_owner');
    const isDoctorWorkspace = roleHint === 'doctor' || allowedRoles.includes('doctor');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 relative animate-fade-in my-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Authentication Required
            </span>
          </div>

          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            isDoctorWorkspace ? 'bg-teal-50 text-teal-600' : (isOwnerWorkspace ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600')
          }`}>
            {isDoctorWorkspace ? (
              <Stethoscope className="w-6 h-6 text-teal-600" />
            ) : isOwnerWorkspace ? (
              <Building2 className="w-6 h-6" />
            ) : (
              <GraduationCap className="w-6 h-6" />
            )}
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 text-center">
            {requiredRoleName} Portal
          </h2>
          <p className="text-xs text-slate-500 text-center mt-1 mb-5">
            {authMode === 'signin' 
              ? 'Sign in to access your authorized operational workspace.' 
              : 'Create a new specialist account. Welcome email will be dispatched.'}
          </p>

          {/* Mode Segmented Control: Sign In vs Register */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setAuthError(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email / Account ID</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="specialist@clinic.com"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              {/* Quick Demo Credentials Preset Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> One-Click Demo Role:
                  </span>
                  <span className="text-[10px] text-slate-400">Pre-seeded</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => selectPreset('operator')}
                    className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                      email.includes('aarav') || email.includes('arjun')
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🎓 Graduate
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('owner')}
                    className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                      email.includes('rajesh')
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏥 Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('doctor')}
                    className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-semibold border transition-all text-center ${
                      email.includes('sneha')
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
                className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDoctorWorkspace
                    ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
                    : isOwnerWorkspace
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Authenticating...' : `Sign In & Enter ${requiredRoleName}`}</span>
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={registerRole === 'doctor' ? 'e.g. Dr. Priya Nair' : 'e.g. Ramesh Kumar'}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              {/* Role Picker for Registration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold cursor-pointer"
                >
                  <option value="doctor">🩺 Doctor Specialist</option>
                  <option value="business_owner">🏥 Clinic Owner / Director</option>
                  <option value="graduate">🎓 Graduate Operator</option>
                </select>
              </div>

              {registerRole === 'doctor' && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-teal-50/50 border border-teal-100 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-semibold text-teal-800 mb-1">Medical Speciality</label>
                    <input
                      type="text"
                      value={speciality}
                      onChange={(e) => setSpeciality(e.target.value)}
                      placeholder="e.g. Cardiologist"
                      className="w-full text-xs p-2 bg-white border border-teal-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-teal-800 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
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
                <span>{isSubmitting ? 'Creating Account & Sending Email...' : 'Complete Registration & Enter Workspace'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. Authenticated, but unauthorized role -> Access Denied Screen
  if (!isAuthorized(allowedRoles)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 animate-fade-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="text-xs font-extrabold tracking-wider uppercase bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
            403 Forbidden • Unauthorized
          </span>

          <h2 className="text-xl font-bold text-slate-900 mt-3">
            Role Permission Denied
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
            You are signed in as <span className="font-bold text-slate-900">{user.name}</span> with role <span className="font-bold uppercase text-indigo-700">"{user.role}"</span>.
            This section is restricted strictly to <span className="font-bold text-slate-900">{requiredRoleName}s</span>.
          </p>

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span>Your Current Account:</span>
              <span className="font-semibold text-slate-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Required Role:</span>
              <span className="font-bold text-emerald-700 uppercase">{allowedRoles.join(' / ')}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                logout();
              }}
              className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Switch Account
            </button>
            <button
              onClick={() => {
                if (user.role === 'graduate') navigate('/operator');
                else if (user.role === 'business_owner') navigate('/clinic');
                else if (user.role === 'doctor') navigate('/doctor');
                else navigate('/');
              }}
              className="w-full sm:flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated & Authorized -> Render Protected Content
  return children;
}
