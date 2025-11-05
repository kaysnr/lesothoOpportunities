// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LesothoOpportunities from './components/LesothoOpportunities';
import StudentAuth from './components/StudentAuth';
import StudentDashboard from './components/student/StudentDashboard';
import InstitutionAuth from './components/InstitutionAuth';
import InstituteDashboard from './components/institute/InstituteDashboard';
import CompanyAuth from './components/CompanyAuth';
import CompanyDashboard from './components/company/CompanyDashboard';
import AdminAuth from './components/AdminAuth'; // ✅ Added
import AdminDashboard from './components/admin/AdminDashboard'; // ✅ Added

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LesothoOpportunities />} />
        
        {/* Student */}
        <Route path="/student-auth" element={<StudentAuth />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        
        {/* Institution */}
        <Route path="/institute-auth" element={<InstitutionAuth />} />
        <Route path="/institute-dashboard" element={<InstituteDashboard />} />
        
        {/* Company */}
        <Route path="/company-auth" element={<CompanyAuth />} />
        <Route path="/company-dashboard" element={<CompanyDashboard />} />
        
        {/* Admin ✅ */}
        <Route path="/admin-auth" element={<AdminAuth />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;