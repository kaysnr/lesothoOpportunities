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

    try {
      const q = query(collection(db, 'courses'), where('institutionId', '==', user.uid));
      const snapshot = await getDocs(q);
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error loading courses:', err);
      setMessage('❌ Failed to load courses.');
    }
  };

  const fetchApplications = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setMessage('');

    try {
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
      setMessage('❌ Failed to load applications.');
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
      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, status } : app))
      );
    } catch (error) {
      console.error('Update failed:', error);
      setMessage('❌ Failed to update status.');
    }
  };

  const publishAdmissions = async () => {
    if (!selectedCourse) {
      setMessage('⚠️ Please select a course.');
      return;
    }
    if (applications.length === 0) {
      setMessage('⚠️ No applications to publish.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const courseName = courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course';

      // Update student admittedInstitutions
      for (const app of applications) {
        if (['Accepted', 'Waitlisted', 'Rejected'].includes(app.status)) {
          await updateDoc(doc(db, 'students', app.studentId), {
            [`admittedInstitutions.${selectedCourse}`]: {
              id: selectedCourse,
              name: courseName,
              status: app.status,
              program: courseName,
              reviewedAt: new Date()
            }
          });
        }
      }

      setMessage('✅ Admission results published successfully!');
    } catch (err) {
      console.error('Publish error:', err);
      setMessage('❌ Failed to publish admissions.');
    } finally {
      setLoading(false);
    }
  };

  const courseName = courses.find(c => c.id === selectedCourse)?.name || '';

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-bullhorn"></i>
          Publish Admissions
        </h2>
        <p>Review applications and publish admission results for <strong>{courseName || 'a course'}</strong></p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : message.includes('⚠️') ? 'lo-alert-warning' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <div className="lo-form-group">
        <label>Select Course *</label>
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setApplications([]);
            setMessage('');
          }}
          className="lo-form-control"
          required
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
          className="lo-btn lo-btn-secondary mt-3"
          onClick={fetchApplications}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i>
          {loading ? 'Loading...' : 'Load Applications'}
        </button>
      )}

      {selectedCourse && !loading && applications.length > 0 && (
        <>
          <div className="lo-section-header mt-4">
            <h3>
              <i className="fas fa-users"></i>
              Applications ({applications.length})
            </h3>
          </div>

          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      {app.student?.firstName || '—'} {app.student?.lastName || ''}
                    </td>
                    <td>{app.student?.email || '—'}</td>
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
                    <td>
                      {app.status === 'Pending' ? (
                        <div className="d-flex flex-wrap gap-1">
                          <button
                            className="lo-table-btn lo-btn-success"
                            onClick={() => updateStatus(app.id, 'Accepted')}
                          >
                            <i className="fas fa-check"></i> Accept
                          </button>
                          <button
                            className="lo-table-btn lo-btn-warning"
                            onClick={() => updateStatus(app.id, 'Waitlisted')}
                          >
                            <i className="fas fa-clock"></i> Waitlist
                          </button>
                          <button
                            className="lo-table-btn lo-btn-danger"
                            onClick={() => updateStatus(app.id, 'Rejected')}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </div>
                      ) : (
                        <span>{app.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lo-publish-section mt-4">
            <h4 className="mb-3">
              ✅ Ready to publish {applications.filter(a => ['Accepted','Waitlisted','Rejected'].includes(a.status)).length} reviewed applications?
            </h4>
            <button
              className="lo-btn lo-btn-primary"
              onClick={publishAdmissions}
              disabled={loading}
            >
              <i className="fas fa-paper-plane"></i>
              {loading ? 'Publishing...' : 'Publish Admission Results'}
            </button>
            <p className="lo-hint mt-2">
              This updates student profiles with admission status. Students will be notified.
            </p>
          </div>
        </>
      )}

      {selectedCourse && !loading && applications.length === 0 && selectedCourse && (
        <div className="lo-no-data mt-4">
          <i className="fas fa-inbox"></i>
          <p>No applications found for <strong>{courseName}</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default PublishAdmissions;