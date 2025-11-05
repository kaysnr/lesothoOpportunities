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
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (!user || !instituteData) {
    return (
      <div className="lo-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="lo-spinner">Loading Institute Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="lo-container">
      <header className="lo-header">
        <div className="lo-logo">
          <i className="fas fa-university"></i>
          <span>{instituteData.name || 'Institute'} Dashboard</span>
        </div>
        <div className="lo-user-actions">
          <div className="lo-profile">
            <span>{instituteData.email}</span>
            <button className="lo-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="lo-main-container">
        <div className="lo-main-content">
          <InstituteSidebar activeView={activeView} setActiveView={setActiveView} />
          
          <main className="lo-content-area">
            {activeView === 'profile' && <InstitutionProfile />}
            {activeView === 'faculties' && <ManageFaculties />}
            {activeView === 'courses' && <ManageCourses />}
            {activeView === 'applications' && <ViewApplications />}
            {activeView === 'admissions' && <PublishAdmissions />}
          </main>
        </div>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities - Institute Portal</div>
        <div className="lo-copyright">© 2025 Lesotho Opportunities</div>
      </footer>
    </div>
  );
};

export default InstituteDashboard;