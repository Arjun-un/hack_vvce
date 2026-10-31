import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LandingPage from './components/LandingPage';
import GraduateWorkspace from './components/GraduateWorkspace';
import CustomerPortal from './components/CustomerPortal';
import ClinicDashboard from './pages/ClinicDashboard';
import CustomerQrPortal from './pages/CustomerQrPortal';
import DoctorDashboard from './pages/DoctorDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Main Home / Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Business Owner (Clinic) Cockpit - Authenticated & Authorized */}
          <Route 
            path="/clinic" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'admin']} requiredRoleName="Clinic Owner" roleHint="owner">
                <ClinicDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clinic/:slug" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'admin']} requiredRoleName="Clinic Owner" roleHint="owner">
                <ClinicDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'admin']} requiredRoleName="Clinic Owner" roleHint="owner">
                <ClinicDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/:slug" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'admin']} requiredRoleName="Clinic Owner" roleHint="owner">
                <ClinicDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Graduate Operator Workspace - Authenticated & Authorized */}
          <Route 
            path="/operator" 
            element={
              <ProtectedRoute allowedRoles={['graduate', 'admin']} requiredRoleName="Graduate Operator" roleHint="operator">
                <GraduateWorkspace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/graduate" 
            element={
              <ProtectedRoute allowedRoles={['graduate', 'admin']} requiredRoleName="Graduate Operator" roleHint="operator">
                <GraduateWorkspace />
              </ProtectedRoute>
            } 
          />

          {/* Doctor Specialist Cockpit - Authenticated & Authorized */}
          <Route 
            path="/doctor" 
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']} requiredRoleName="Doctor Specialist" roleHint="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/:slug" 
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']} requiredRoleName="Doctor Specialist" roleHint="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doc" 
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']} requiredRoleName="Doctor Specialist" roleHint="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Customer QR Patient Portals - Publicly Accessible without login */}
          <Route path="/qr/:slug" element={<CustomerQrPortal />} />
          <Route path="/qr" element={<CustomerQrPortal />} />
          <Route path="/c/:clinicSlug" element={<CustomerPortal />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

