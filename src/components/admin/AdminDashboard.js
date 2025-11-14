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
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAdminData({ email: firebaseUser.email, name: 'Admin' });
      } else {
        window.location.href = '/';
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading || !user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{
        background: 'linear-gradient(135deg, var(--lo-purple-mid), var(--lo-purple-main))'
      }}>
        <div className="lo-spinner"></div>
      </div>
    );
  }

  return (
    <div className="lo-main-container">
      {/* Header */}
      <header className="lo-header">
        <div className="d-flex align-items-center">
          <button 
            className={`lo-hamburger d-lg-none me-3 ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="lo-logo">
            <span role="img" aria-label="admin">👔</span>
            <span className="lo-logo-text">
              Lesotho Opportunities — Admin
            </span>
          </div>
        </div>
        
        <div className="lo-user-actions">
          <div className="lo-profile-dropdown">
            <div className="lo-profile" tabIndex="0">
              <i className="fas fa-user-tie"></i>
              <span className="lo-profile-name d-none d-md-inline">
                {adminData?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>
            <div className="lo-profile-menu">
              <button onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="lo-main-content">
        {/* Sidebar */}
        <aside className={`lo-sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="lo-sidebar-backdrop" onClick={toggleMobileMenu}></div>
          <div className="lo-sidebar-content">
            <AdminSidebar 
              activeView={activeView} 
              setActiveView={setActiveView}
              onItemClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </aside>

        {/* Content Area */}
        <main className="lo-content-area">
          <div className="lo-banner">
            <div className="lo-banner-content">
              <h1 className="lo-banner-title">
                Welcome, Administrator
              </h1>
              <p className="lo-banner-subtitle">
                Manage the entire platform: institutions, companies, courses, and admissions.
              </p>
            </div>
          </div>

          {activeView === 'institutions' && <ManageInstitutions />}
          {activeView === 'faculties' && <ManageFaculties />}
          {activeView === 'courses' && <ManageCourses />}
          {activeView === 'companies' && <ManageCompanies />}
          {activeView === 'admissions' && <PublishAdmissions />}
          {activeView === 'reports' && <SystemReports />}
        </main>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities</div>
        <p className="lo-copyright">© {new Date().getFullYear()} • Admin Portal</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;