import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import GraduateWorkspace from './components/GraduateWorkspace';
import CustomerPortal from './components/CustomerPortal';
import ClinicDashboard from './pages/ClinicDashboard';
import CustomerQrPortal from './pages/CustomerQrPortal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Home / Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Business Owner (Clinic) Dashboard */}
        <Route path="/clinic" element={<ClinicDashboard />} />
        <Route path="/owner" element={<ClinicDashboard />} />

        {/* Graduate Operator Workspace */}
        <Route path="/operator" element={<GraduateWorkspace />} />
        <Route path="/graduate" element={<GraduateWorkspace />} />

        {/* Customer QR Patient Portals */}
        <Route path="/qr/:slug" element={<CustomerQrPortal />} />
        <Route path="/qr" element={<CustomerQrPortal />} />
        <Route path="/c/:clinicSlug" element={<CustomerPortal />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
