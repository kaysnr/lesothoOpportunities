// src/components/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  addDoc
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

const COLORS = ['#FFBB28', '#00C49F', '#FF8042', '#0088FE'];

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeView, setActiveView] = useState('overview');

  const [stats, setStats] = useState({
    pendingApplications: 0,
    admitted: 0,
    rejected: 0,
    jobNotifications: 0
  });

  const [notifications, setNotifications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  // ✅ Reusable fetch function
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
      if (studentData.admittedInstitutions) {
        Object.values(studentData.admittedInstitutions).forEach(inst => {
          admissionsList.push({
            institution: inst.name,
            program: inst.program || 'N/A',
            status: inst.status
          });
        });
      }

      setStats({ pendingApplications: pending, admitted, rejected, jobNotifications: matchingJobs.length });
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
    });
    return () => unsubscribe();
  }, []);

  // ✅ FIXED: After applying, refetch data to update stats
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

      // ✅ Update local applied set
      const newAppliedSet = new Set([...appliedJobIds, jobId]);
      setAppliedJobIds(newAppliedSet);

      // ✅ CRITICAL: Refetch dashboard data to update stats & notifications
      if (studentData) {
        await fetchDashboardData(user.uid, studentData);
      }

      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply. Please try again.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (!user || !studentData) {
    return (
      <div className="lo-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="lo-spinner">Loading dashboard...</div>
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
    <div className="student-overview">
      <div className="lo-page-header">
        <h2>Welcome, <strong>{studentData.firstName || 'Student'}</strong>!</h2>
        <p className="lo-subtitle">{studentData.purpose || 'Your journey starts here.'}</p>
      </div>

      <div className="lo-stats-section">
        <div className="lo-chart-card">
          <h3 className="lo-card-title">Application Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            {applicationChartData.length > 0 ? (
              <PieChart>
                <Pie
                  data={applicationChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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

        <div className="lo-chart-card">
          <h3 className="lo-card-title">Matching Job Opportunities</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={notificationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00C49F" name="Active Matches" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Job Notifications Table */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>Matching Job Opportunities</h3>
          <button className="lo-view-all" onClick={() => setActiveView('jobs')}>
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
                        : 'N/A'}
                    </td>
                    <td>
                      {appliedJobIds.has(job.id) ? (
                        <span className="lo-status approved">Applied</span>
                      ) : (
                        <button
                          className="lo-table-btn lo-btn-success"
                          onClick={() => handleApplyJob(job.id)}
                        >
                          Apply
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lo-no-data">No matching job opportunities found. Update your GPA in your profile to see more!</div>
        )}
      </div>

      {/* Admissions Table */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>Admission Results</h3>
          <button className="lo-view-all" onClick={() => setActiveView('admissions')}>
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
                      <span className={`lo-status ${admission.status.toLowerCase()}`}>
                        {admission.status}
                      </span>
                    </td>
                    <td>
                      {admission.status === 'Admitted' && (
                        <button className="lo-table-btn lo-btn-primary">Confirm</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lo-no-data">No admission results yet.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="lo-container">
      <header className="lo-header">
        <div className="lo-logo">
          <i className="fas fa-graduation-cap"></i>
          <span>Lesotho Opportunities - Student Portal</span>
        </div>
        <div className="lo-user-actions">
          <div className="lo-profile">
            <span>{studentData.email}</span>
            <button className="lo-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="lo-main-container">
        <div className="lo-main-content">
          <StudentSidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="lo-content-area">
            {activeView === 'overview' && renderOverview()}
            {activeView === 'courses' && <CourseApplication studentId={user.uid} />}
            {activeView === 'jobs' && <JobApplications studentId={user.uid} />}
            {activeView === 'profile' && <Profile studentId={user.uid} studentData={studentData} />}
            {activeView === 'admissions' && <AdmissionsView studentId={user.uid} />}
          </main>
        </div>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities - Student Portal</div>
        <div className="lo-copyright">© 2025 Lesotho Opportunities</div>
      </footer>
    </div>
  );
};

export default StudentDashboard;