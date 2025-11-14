// src/components/company/CompanyDashboard.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import CompanySidebar from './CompanySidebar';
import PostJob from './PostJob';
import ViewApplicants from './ViewApplicants';
import CompanyProfile from './CompanyProfile';
import '../../styles/LesothoOpportunities.css';

const CompanyDashboard = () => {
  const [user, setUser] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [activeView, setActiveView] = useState('profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'companies', firebaseUser.uid));
        if (userDoc.exists()) {
          setCompanyData(userDoc.data());
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

  if (loading || !user || !companyData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--lo-purple-mid), var(--lo-purple-main))'
      }}>
        <div className="lo-grid-item skeleton" style={{ width: '200px', height: '60px', borderRadius: '12px' }}>
          <div style={{ height: '20px', margin: '20px', borderRadius: '4px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="lo-main-container" style={{ marginTop: '0', paddingTop: '20px' }}>
      {/* ✅ Header */}
      <header className="lo-header">
        <div className="lo-logo">
          <span role="img" aria-label="building">🏢</span>
          <span className="lo-logo-text">
            {companyData.name || 'Company'} Dashboard
          </span>
        </div>
        <div className="lo-user-actions">
          <div className="lo-profile-dropdown">
            <div className="lo-profile" tabIndex="0">
              <i className="fas fa-building" style={{ fontSize: '1.4rem' }}></i>
              <span className="lo-profile-name">
                {companyData.name?.split(' ')[0] || 'Admin'}
              </span>
            </div>
            <div className="lo-profile-menu">
              <button onClick={() => setActiveView('profile')}>
                <i className="fas fa-user"></i> Profile
              </button>
              <button onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Main Content */}
      <div className="lo-main-content">
        <aside className="lo-sidebar">
          <CompanySidebar 
            activeView={activeView} 
            setActiveView={setActiveView}
            companyData={companyData}
          />
        </aside>

        <main className="lo-content-area" style={{ flex: 1, minWidth: 0 }}>
          <div className="lo-banner" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="lo-banner-content">
              <h1 className="lo-banner-title" style={{ fontSize: '2rem', margin: 0 }}>
                Welcome, {companyData.name || 'Company'}
              </h1>
              <p className="lo-banner-subtitle" style={{ opacity: 0.85, margin: '8px 0 0' }}>
                Post jobs, review applicants, and grow your team.
              </p>
            </div>
          </div>

          {activeView === 'profile' && <CompanyProfile companyData={companyData} />}
          {activeView === 'post-job' && <PostJob companyId={user.uid} />}
          {activeView === 'applicants' && <ViewApplicants />}
        </main>
      </div>

      {/* ✅ Footer */}
      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities</div>
        <p className="lo-copyright">© {new Date().getFullYear()} • Company Portal</p>
      </footer>
    </div>
  );
};

export default CompanyDashboard;