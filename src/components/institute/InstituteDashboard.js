// src/components/institute/InstituteDashboard.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import InstituteSidebar from './InstituteSidebar';
import ManageFaculties from './ManageFaculties';
import ManageCourses from './ManageCourses';
import ViewApplications from './ViewApplications';
import PublishAdmissions from './PublishAdmissions';
import InstitutionProfile from './InstitutionProfile';
import '../../styles/LesothoOpportunities.css';

const InstituteDashboard = () => {
  const [user, setUser] = useState(null);
  const [instituteData, setInstituteData] = useState(null);
  const [activeView, setActiveView] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'institutions', firebaseUser.uid));
        if (userDoc.exists()) {
          setInstituteData(userDoc.data());
          setUser(firebaseUser);
        } else {
          window.location.href = '/';
        }
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

  if (loading || !user || !instituteData) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{
        background: 'linear-gradient(135deg, var(--lo-purple-mid), var(--lo-purple-main))'
      }}>
        <div className="skeleton" style={{ width: '200px', height: '60px', borderRadius: '12px' }}>
          <div style={{ height: '20px', margin: '20px', borderRadius: '4px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="lo-main-container">
      {/* Header */}
      <header className="lo-header">
        <div className="d-flex align-items-center">
          <button 
            className="lo-hamburger d-lg-none me-3"
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="lo-logo">
            <span role="img" aria-label="institution">🏫</span>
            <span className="lo-logo-text">
              Lesotho Opportunities — Institute
            </span>
          </div>
        </div>
        
        <div className="lo-user-actions">
          <div className="lo-profile-dropdown">
            <div className="lo-profile" tabIndex="0">
              <i className="fas fa-university"></i>
              <span className="lo-profile-name d-none d-md-inline">
                {instituteData.name?.split(' ')[0] || 'Institute'}
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
            <InstituteSidebar 
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
                Welcome, {instituteData.name || 'Institute'}
              </h1>
              <p className="lo-banner-subtitle">
                Manage your institution's faculties, courses, and admissions.
              </p>
            </div>
          </div>

          {activeView === 'profile' && <InstitutionProfile />}
          {activeView === 'faculties' && <ManageFaculties />}
          {activeView === 'courses' && <ManageCourses />}
          {activeView === 'applications' && <ViewApplications />}
          {activeView === 'admissions' && <PublishAdmissions />}
        </main>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities</div>
        <p className="lo-copyright">© {new Date().getFullYear()} • Institute Portal</p>
      </footer>
    </div>
  );
};

export default InstituteDashboard;