// src/components/institute/ViewApplications.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const ViewApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setMessage('');
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get institution's courses
      const coursesQuery = query(collection(db, 'courses'), where('institutionId', '==', user.uid));
      const coursesSnapshot = await getDocs(coursesQuery);
      const courseMap = {};
      coursesSnapshot.forEach(doc => {
        courseMap[doc.id] = doc.data().name || 'Unnamed Course';
      });

      // Get applications from 'courseApplications'
      const appsQuery = query(collection(db, 'courseApplications'), where('institutionId', '==', user.uid));
      const appsSnapshot = await getDocs(appsQuery);

      const apps = [];
      for (const appDoc of appsSnapshot.docs) {
        const appData = appDoc.data();
        const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
        const courseName = courseMap[appData.courseId] || '—';

        apps.push({
          id: appDoc.id,
          ...appData,
          courseName,
          student: studentDoc.exists() ? studentDoc.data() : null
        });
      }

      setApplications(apps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setMessage('❌ Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lo-institute-module">
        <div className="lo-no-data">
          <div className="lo-spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  const grouped = applications.reduce((acc, app) => {
    const status = app.status || 'Pending';
    if (!acc[status]) acc[status] = [];
    acc[status].push(app);
    return acc;
  }, {});

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-file-alt"></i>
          Student Course Applications
        </h2>
        <p>Review applications to your institution's courses</p>
      </div>

      {message && (
        <div className="lo-alert lo-alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {message}
        </div>
      )}

      <div className="row g-3 mb-4">
        {Object.entries(grouped).map(([status, list]) => (
          <div key={status} className="col-sm-6 col-lg-3">
            <div className={`lo-stat-card ${status.toLowerCase()}`}>
              <div className="lo-stat-value">{list.length}</div>
              <div className="lo-stat-label">{status} Applications</div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="lo-no-data">
          <i className="fas fa-file-alt"></i>
          <p>No course applications received yet.</p>
          <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
            Students can apply once admissions are published.
          </p>
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Applied On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td>
                    {app.student?.firstName || '—'} {app.student?.lastName || ''}
                  </td>
                  <td>{app.student?.email || '—'}</td>
                  <td>{app.courseName}</td>
                  <td>
                    {app.appliedAt?.toDate 
                      ? app.appliedAt.toDate().toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td>
                    <span className={`lo-status ${app.status?.toLowerCase() || 'pending'}`}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="lo-hint mt-4">
        <i className="fas fa-lightbulb"></i>
        To take action on applications, go to <strong>Publish Admissions</strong>.
      </div>
    </div>
  );
};

export default ViewApplications;