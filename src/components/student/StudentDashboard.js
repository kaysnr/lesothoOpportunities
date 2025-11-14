// src/components/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, addDoc
} from 'firebase/firestore';
import StudentSidebar from './StudentSidebar';
import Profile from './Profile';
import CourseApplication from './CourseApplication';
import JobApplications from './JobApplications';
import AdmissionsView from './AdmissionsView';
import '../../styles/LesothoOpportunities.css';

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#5d47e6', '#2ecc71', '#ff6b6b', '#fbbf24'];

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    pendingApplications: 0,
    admitted: 0,
    rejected: 0,
    jobNotifications: 0
  });

  const [notifications, setNotifications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  const fetchDashboardData = async (studentId, studentData) => {
    try {
      const applicationsRef = collection(db, 'applications');
      const applicationsQuery = query(applicationsRef, where('studentId', '==', studentId));
      const applicationsSnapshot = await getDocs(applicationsQuery);

      let pending = 0, admitted = 0, rejected = 0;
      applicationsSnapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'Pending') pending++;
        else if (status === 'Accepted') admitted++;
        else if (status === 'Rejected') rejected++;
      });

      const jobsRef = collection(db, 'jobs');
      const jobsQuery = query(jobsRef, where('isActive', '==', true));
      const jobsSnapshot = await getDocs(jobsQuery);
      const studentGPA = studentData.gpa || 0;

      const matchingJobs = jobsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(job => !job.minGPA || studentGPA >= job.minGPA);

      const admissionsList = [];
      if (Array.isArray(studentData.admittedInstitutions)) {
        studentData.admittedInstitutions.forEach(inst => {
          admissionsList.push({
            id: inst.id,
            institution: inst.name,
            program: inst.program || 'N/A',
            status: inst.status
          });
        });
      }

      setStats({ 
        pendingApplications: pending, 
        admitted, 
        rejected, 
        jobNotifications: matchingJobs.length 
      });
      setNotifications(matchingJobs.slice(0, 3));
      setAdmissions(admissionsList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'students', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStudentData(data);
          setUser(firebaseUser);
          const applied = data.appliedJobs || [];
          setAppliedJobIds(new Set(applied));
          await fetchDashboardData(firebaseUser.uid, data);
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

  const handleApplyJob = async (jobId) => {
    if (appliedJobIds.has(jobId)) return;

    try {
      const newApplication = {
        studentId: user.uid,
        jobId: jobId,
        appliedAt: new Date(),
        status: 'Pending'
      };

      await addDoc(collection(db, 'applications'), newApplication);

      await updateDoc(doc(db, 'students', user.uid), {
        appliedJobs: arrayUnion(jobId)
      });

      await updateDoc(doc(db, 'jobs', jobId), {
        applicants: arrayUnion(user.uid)
      });

      const newAppliedSet = new Set([...appliedJobIds, jobId]);
      setAppliedJobIds(newAppliedSet);

      if (studentData) {
        await fetchDashboardData(user.uid, studentData);
      }

      alert('✅ Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('❌ Failed to apply. Please try again.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading || !user || !studentData) {
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

  const applicationChartData = [
    { name: 'Pending', value: stats.pendingApplications },
    { name: 'Admitted', value: stats.admitted },
    { name: 'Rejected', value: stats.rejected }
  ].filter(item => item.value > 0);

  const notificationData = [
    { name: 'Matching Jobs', value: stats.jobNotifications }
  ];

  const renderOverview = () => (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-home"></i>
          Welcome, <strong>{studentData.firstName || 'Student'}</strong>!
        </h2>
        <p>{studentData.purpose || 'Your journey starts here.'}</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="lo-stat-card">
            <div className="lo-stat-value">{stats.pendingApplications}</div>
            <div className="lo-stat-label">Pending Apps</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="lo-stat-card approved">
            <div className="lo-stat-value">{stats.admitted}</div>
            <div className="lo-stat-label">Admitted</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="lo-stat-card rejected">
            <div className="lo-stat-value">{stats.rejected}</div>
            <div className="lo-stat-label">Rejected</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="lo-stat-card info">
            <div className="lo-stat-value">{stats.jobNotifications}</div>
            <div className="lo-stat-label">Job Matches</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="lo-chart-card">
            <h3 className="lo-card-title">
              <i className="fas fa-file-alt"></i>
              Application Status
            </h3>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                {applicationChartData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={applicationChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {applicationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="lo-no-data">No applications yet</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="lo-chart-card">
            <h3 className="lo-card-title">
              <i className="fas fa-briefcase"></i>
              Job Opportunities
            </h3>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={notificationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Active Matches" 
                    fill="#5d47e6" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Job Notifications */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-bullhorn"></i>
            Matching Job Opportunities
          </h3>
          <button 
            className="lo-view-all" 
            onClick={() => setActiveView('jobs')}
          >
            View All Jobs <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        {notifications.length > 0 ? (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Min GPA</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(job => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.companyName}</td>
                    <td>{job.location || 'Remote'}</td>
                    <td>
                      {job.minGPA && !isNaN(job.minGPA)
                        ? Number(job.minGPA).toFixed(2)
                        : '—'}
                    </td>
                    <td>
                      {appliedJobIds.has(job.id) ? (
                        <span className="lo-status approved">Applied</span>
                      ) : (
                        <button
                          className="lo-table-btn lo-btn-success"
                          onClick={() => handleApplyJob(job.id)}
                        >
                          <i className="fas fa-paper-plane"></i> Apply
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lo-no-data">
            <i className="fas fa-search"></i>
            <p>No matching job opportunities found.</p>
            <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
              Update your GPA in <strong>My Profile</strong> to see more opportunities.
            </p>
          </div>
        )}
      </div>

      {/* Admissions */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-check-circle"></i>
            Admission Results
          </h3>
          <button 
            className="lo-view-all" 
            onClick={() => setActiveView('admissions')}
          >
            View All <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        {admissions.length > 0 ? (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((admission, index) => (
                  <tr key={index}>
                    <td>{admission.institution}</td>
                    <td>{admission.program}</td>
                    <td>
                      <span className={`lo-status ${admission.status?.toLowerCase() || 'admitted'}`}>
                        {admission.status || 'Admitted'}
                      </span>
                    </td>
                    <td>
                      {admission.status === 'Admitted' && (
                        <button 
                          className="lo-table-btn lo-btn-primary"
                          onClick={() => {
                            alert('✅ Institution selection confirmed!');
                          }}
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lo-no-data">
            <i className="fas fa-envelope-open"></i>
            <p>No admission results yet.</p>
          </div>
        )}
      </div>
    </div>
  );

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
            <span role="img" aria-label="graduation cap">🎓</span>
            <span className="lo-logo-text">
              Lesotho Opportunities
            </span>
          </div>
        </div>
        
        <div className="lo-user-actions">
          <div className="lo-profile-dropdown">
            <div className="lo-profile" tabIndex="0">
              <i className="fas fa-user-graduate"></i>
              <span className="lo-profile-name d-none d-md-inline">
                {studentData.firstName?.split(' ')[0] || 'Student'}
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

      {/* Main Content */}
      <div className="lo-main-content">
        {/* Sidebar */}
        <aside className={`lo-sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="lo-sidebar-backdrop" onClick={toggleMobileMenu}></div>
          <div className="lo-sidebar-content">
            <StudentSidebar 
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
                Your Opportunities
              </h1>
              <p className="lo-banner-subtitle">
                Apply for courses, find jobs, and track your admissions.
              </p>
            </div>
          </div>

          {activeView === 'overview' && renderOverview()}
          {activeView === 'courses' && <CourseApplication studentId={user.uid} />}
          {activeView === 'jobs' && <JobApplications studentId={user.uid} />}
          {activeView === 'profile' && <Profile studentId={user.uid} studentData={studentData} />}
          {activeView === 'admissions' && <AdmissionsView studentId={user.uid} />}
        </main>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities</div>
        <p className="lo-copyright">© {new Date().getFullYear()} • Student Portal</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;