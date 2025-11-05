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
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (!user || !companyData) {
    return <div className="lo-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="lo-container">
      <header className="lo-header">
        <div className="lo-logo">
          <i className="fas fa-building"></i>
          <span>{companyData.name || 'Company'} Dashboard</span>
        </div>
        <div className="lo-user-actions">
          <div className="lo-profile">
            <span>{companyData.email}</span>
            <button className="lo-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="lo-main-container">
        <div className="lo-main-content">
          <CompanySidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="lo-content-area">
            {activeView === 'profile' && <CompanyProfile />}
            {activeView === 'post-job' && <PostJob />}
            {activeView === 'applicants' && <ViewApplicants />}
          </main>
        </div>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities - Company Portal</div>
        <div className="lo-copyright">© 2025 Lesotho Opportunities</div>
      </footer>
    </div>
  );
};

export default CompanyDashboard;