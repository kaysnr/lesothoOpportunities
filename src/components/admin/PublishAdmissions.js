// src/components/admin/PublishAdmissions.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  getDoc,
  arrayUnion
} from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const PublishAdmissions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch institutions
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const instSnapshot = await getDocs(collection(db, 'institutions'));
        setInstitutions(instSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching institutions:', err);
        setMessage('❌ Failed to load institutions.');
      }
    };
    fetchInstitutions();
  }, []);

  // Fetch courses when institution is selected
  useEffect(() => {
    if (!selectedInstitution) {
      setCourses([]);
      setSelectedCourse('');
      setApplications([]);
      return;
    }

    const fetchCourses = async () => {
      try {
        const courseQuery = query(
          collection(db, 'courses'),
          where('institutionId', '==', selectedInstitution)
        );
        const courseSnapshot = await getDocs(courseQuery);
        setCourses(courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching courses:', err);
        setMessage('❌ Failed to load courses.');
      }
    };
    fetchCourses();
  }, [selectedInstitution]);

  // Fetch applications function - moved to component scope
  const fetchApplications = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    setMessage('');

    try {
      const appQuery = query(
        collection(db, 'courseApplications'),
        where('courseId', '==', selectedCourse)
      );
      const appSnapshot = await getDocs(appQuery);
      const apps = [];
      
      for (const appDoc of appSnapshot.docs) {
        const appData = appDoc.data();
        const studentDocRef = doc(db, 'students', appData.studentId);
        const studentSnap = await getDoc(studentDocRef);
        
        const studentData = studentSnap.exists() ? studentSnap.data() : {};
        apps.push({
          id: appDoc.id,
          studentId: appData.studentId,
          studentEmail: studentData.email || 'Unknown',
          studentName: studentData.firstName || studentData.lastName 
            ? `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() 
            : 'Unknown',
          status: appData.status || 'Pending',
          gpa: studentData.gpa || 0,
          appliedAt: appData.appliedAt?.toDate ? appData.appliedAt.toDate() : null
        });
      }
      setApplications(apps);
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage('❌ Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch applications when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchApplications();
    }
  }, [selectedCourse]);

  const handlePublish = async () => {
    if (applications.length === 0) {
      setMessage('⚠️ No applications to publish.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const course = courses.find(c => c.id === selectedCourse);
      const institution = institutions.find(i => i.id === selectedInstitution);
      const courseName = course?.name || 'Unknown Course';
      const institutionName = institution?.name || 'N/A';

      const studentUpdatePromises = applications.map(async (app) => {
        const studentRef = doc(db, 'students', app.studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (!studentSnap.exists()) return;

        const currentData = studentSnap.data();
        const currentAdmissions = Array.isArray(currentData.admittedInstitutions) 
          ? currentData.admittedInstitutions 
          : [];

        const alreadyAdmitted = currentAdmissions.some(inst => 
          inst.id === selectedCourse && inst.status === 'Admitted'
        );
        
        if (!alreadyAdmitted) {
          await updateDoc(studentRef, {
            admittedInstitutions: arrayUnion({
              id: selectedCourse,
              institutionId: selectedInstitution,
              name: institutionName,
              program: courseName,
              status: 'Admitted',
              admittedAt: new Date()
            })
          });
        }
      });

      await Promise.all(studentUpdatePromises);

      const publishPromises = applications.map(app =>
        updateDoc(doc(db, 'courseApplications', app.id), { 
          status: 'Published',
          publishedAt: new Date()
        })
      );
      await Promise.all(publishPromises);

      setMessage('✅ Admission results published successfully!');
    } catch (error) {
      console.error('Publish error:', error);
      setMessage('❌ Failed to publish admissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const institution = institutions.find(i => i.id === selectedInstitution);
  const course = courses.find(c => c.id === selectedCourse);

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-bullhorn"></i>
          Publish Admissions
        </h2>
        <p>Select an institution and course to publish admission results.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : message.includes('⚠️') ? 'lo-alert-warning' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <div className="lo-form-group">
            <label>Institution *</label>
            <select
              value={selectedInstitution}
              onChange={(e) => {
                setSelectedInstitution(e.target.value);
                setSelectedCourse('');
                setApplications([]);
                setMessage('');
              }}
              className="lo-form-control"
              required
            >
              <option value="">Select Institution</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-md-6">
          <div className="lo-form-group">
            <label>Course *</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setMessage('');
              }}
              disabled={!selectedInstitution}
              className="lo-form-control"
              required
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCourse && applications.length === 0 && !loading && (
        <div className="lo-no-data mt-4">
          <i className="fas fa-inbox"></i>
          <p>No applications found for <strong>{course?.name}</strong>.</p>
          <p className="mt-2">
            <button
              className="lo-btn lo-btn-secondary"
              onClick={fetchApplications}
              disabled={loading}
            >
              <i className="fas fa-sync-alt"></i>
              {loading ? 'Loading...' : 'Refresh Applications'}
            </button>
          </p>
        </div>
      )}

      {selectedCourse && applications.length > 0 && (
        <>
          <div className="lo-section-header mt-4">
            <h3>
              <i className="fas fa-users"></i>
              Applications ({applications.length})
            </h3>
            <button
              className="lo-btn lo-btn-secondary"
              onClick={fetchApplications}
              disabled={loading}
            >
              <i className="fas fa-sync-alt"></i>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>GPA</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>{app.studentName || app.studentEmail}</td>
                    <td>{app.studentEmail}</td>
                    <td>{app.gpa ? app.gpa.toFixed(2) : '—'}</td>
                    <td>
                      {app.appliedAt
                        ? app.appliedAt.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td>
                      <span className={`lo-status ${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lo-publish-section mt-4">
            <h4 className="mb-3">
              ✅ Ready to publish {applications.length} admission(s)?
            </h4>
            <button
              className="lo-btn lo-btn-primary"
              onClick={handlePublish}
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

      {loading && (
        <div className="lo-no-data mt-4">
          <div className="lo-spinner"></div>
          <p>Loading applications...</p>
        </div>
      )}
    </div>
  );
};

export default PublishAdmissions;