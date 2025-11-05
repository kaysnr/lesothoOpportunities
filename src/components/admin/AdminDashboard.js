// src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import ManageInstitutions from './ManageInstitutions';
import ManageFaculties from './ManageFaculties';
import ManageCourses from './ManageCourses';
import ManageCompanies from './ManageCompanies';
import PublishAdmissions from './PublishAdmissions';
import SystemReports from './SystemReports';
import '../../styles/LesothoOpportunities.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [activeView, setActiveView] = useState('institutions');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Admins don't have a Firestore doc, so just verify auth
        setUser(firebaseUser);
        setAdminData({ email: firebaseUser.email });
      } else {
        window.location.href = '/';
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (!user) {
    return <div className="lo-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="lo-container">
      <header className="lo-header">
        <div className="lo-logo">
          <i className="fas fa-user-tie"></i>
          <span>Lesotho Opportunities - Admin Portal</span>
        </div>
        <div className="lo-user-actions">
          <div className="lo-profile">
            <span>{adminData?.email}</span>
            <button className="lo-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="lo-main-container">
        <div className="lo-main-content">
          <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="lo-content-area">
            {activeView === 'institutions' && <ManageInstitutions />}
            {activeView === 'faculties' && <ManageFaculties />}
            {activeView === 'courses' && <ManageCourses />}
            {activeView === 'companies' && <ManageCompanies />}
            {activeView === 'admissions' && <PublishAdmissions />}
            {activeView === 'reports' && <SystemReports />}
          </main>
        </div>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities - Admin Portal</div>
        <div className="lo-copyright">© 2025 Lesotho Opportunities</div>
      </footer>
    </div>
  );
};

export default AdminDashboard;