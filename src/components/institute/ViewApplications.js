// src/components/institute/ViewApplications.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const ViewApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
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

      // Get applications to these courses from 'courseApplications'
      const apps = [];
      const appsQuery = query(collection(db, 'courseApplications'), where('institutionId', '==', user.uid));
      const appsSnapshot = await getDocs(appsQuery);

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
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, 'courseApplications', appId), { status, reviewedAt: new Date() });
      await fetchApplications(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="lo-institute-module">
        <div className="lo-no-data">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Student Course Applications</h2>
        <p>Review applications to your institution's courses</p>
      </div>

      {applications.length === 0 ? (
        <div className="lo-no-data">No course applications received yet.</div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student Email</th>
                <th>Course</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td>
                    {app.student?.firstName} {app.student?.lastName}
                  </td>
                  <td>{app.student?.email || '—'}</td>
                  <td>{app.courseName}</td>
                  <td>
                    {app.appliedAt?.toDate 
                      ? app.appliedAt.toDate().toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`lo-status ${app.status?.toLowerCase() || 'pending'}`}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {app.status === 'Pending' ? (
                      <>
                        <button
                          className="lo-table-btn lo-btn-success"
                          onClick={() => updateStatus(app.id, 'Accepted')}
                          style={{ marginRight: '8px' }}
                        >
                          Accept
                        </button>
                        <button
                          className="lo-table-btn lo-btn-danger"
                          onClick={() => updateStatus(app.id, 'Rejected')}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>{app.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;