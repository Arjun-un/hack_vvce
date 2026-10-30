import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GraduateWorkspace from './components/GraduateWorkspace';
import CustomerPortal from './components/CustomerPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Home / Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Graduate Operator Workspace */}
        <Route path="/operator" element={<GraduateWorkspace />} />

        {/* Customer QR Experience Route */}
        <Route path="/c/:clinicSlug" element={<CustomerPortal />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
