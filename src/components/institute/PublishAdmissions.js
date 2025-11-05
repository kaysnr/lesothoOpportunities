// src/components/institute/PublishAdmissions.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const PublishAdmissions = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'courses'), where('institutionId', '==', user.uid));
    const snapshot = await getDocs(q);
    setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchApplications = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      // ✅ Read from 'courseApplications' (NOT 'applications')
      const appsQuery = query(
        collection(db, 'courseApplications'),
        where('courseId', '==', selectedCourse)
      );
      const appsSnapshot = await getDocs(appsQuery);
      const apps = [];

      for (const appDoc of appsSnapshot.docs) {
        const appData = appDoc.data();
        const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
        apps.push({
          id: appDoc.id,
          ...appData,
          student: studentDoc.exists() ? studentDoc.data() : null
        });
      }

      setApplications(apps);
    } catch (err) {
      console.error('Error loading applications:', err);
      setMessage('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, 'courseApplications', appId), {
        status,
        reviewedAt: new Date()
      });
      // Update local state
      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, status } : app))
      );
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const publishAdmissions = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setMessage('');

    try {
      const courseName = courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course';

      // Group students by status
      const admittedStudents = [];
      const waitlistedStudents = [];

      applications.forEach(app => {
        if (app.status === 'Accepted') {
          admittedStudents.push(app);
        } else if (app.status === 'Waitlisted') {
          waitlistedStudents.push(app);
        }
      });

      // Update each student's admittedInstitutions
      for (const app of admittedStudents) {
        await updateDoc(doc(db, 'students', app.studentId), {
          [`admittedInstitutions.${selectedCourse}`]: {
            id: selectedCourse,
            name: courseName,
            status: 'Admitted',
            program: courseName
          }
        });
      }

      for (const app of waitlistedStudents) {
        await updateDoc(doc(db, 'students', app.studentId), {
          [`admittedInstitutions.${selectedCourse}`]: {
            id: selectedCourse,
            name: courseName,
            status: 'Waitlisted',
            program: courseName
          }
        });
      }

      setMessage('✅ Admission results published successfully!');
    } catch (err) {
      console.error('Publish error:', err);
      setMessage('❌ Failed to publish admissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Publish Admissions</h2>
        <p>Review applications and publish admission results</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <div className="lo-form-group" style={{ marginBottom: '24px' }}>
        <label>Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setApplications([]);
          }}
          className="lo-form-control"
        >
          <option value="">Choose a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <button
          className="lo-btn lo-btn-secondary"
          onClick={fetchApplications}
          disabled={loading}
          style={{ marginBottom: '24px' }}
        >
          Load Applications
        </button>
      )}

      {selectedCourse && !loading && applications.length > 0 && (
        <>
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      {app.student?.firstName} {app.student?.lastName}
                    </td>
                    <td>{app.student?.email || '—'}</td>
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
                            className="lo-table-btn lo-btn-warning"
                            onClick={() => updateStatus(app.id, 'Waitlisted')}
                            style={{ marginRight: '8px' }}
                          >
                            Waitlist
                          </button>
                          <button
                            className="lo-table-btn lo-btn-danger"
                            onClick={() => updateStatus(app.id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        app.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              className="lo-btn lo-btn-primary"
              onClick={publishAdmissions}
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Admission Results'}
            </button>
            <p style={{ marginTop: '8px', color: '#64748b' }}>
              This will update student profiles with admission status.
            </p>
          </div>
        </>
      )}

      {selectedCourse && !loading && applications.length === 0 && (
        <div className="lo-no-data">No applications found for this course.</div>
      )}
    </div>
  );
};

export default PublishAdmissions;