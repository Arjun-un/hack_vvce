import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GraduateWorkspace from './components/GraduateWorkspace';
import CustomerPortal from './components/CustomerPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Graduate Operator Workspace (Default Route) */}
        <Route path="/" element={<GraduateWorkspace />} />

        {/* Customer QR Experience Route */}
        <Route path="/c/:clinicSlug" element={<CustomerPortal />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
