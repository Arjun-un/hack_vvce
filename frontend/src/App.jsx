import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClinicDashboard from './pages/ClinicDashboard';
import CustomerQrPortal from './pages/CustomerQrPortal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Clinic Owner / Client Dashboard */}
        <Route path="/" element={<ClinicDashboard />} />
        <Route path="/clinic" element={<ClinicDashboard />} />

        {/* Customer No-App QR Experience */}
        <Route path="/qr/:slug" element={<CustomerQrPortal />} />
        <Route path="/qr" element={<CustomerQrPortal />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
