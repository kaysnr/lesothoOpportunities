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
      const instSnapshot = await getDocs(collection(db, 'institutions'));
      setInstitutions(instSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchInstitutions();
  }, []);

  // Fetch courses
  useEffect(() => {
    if (!selectedInstitution) {
      setCourses([]);
      setSelectedCourse('');
      setApplications([]);
      return;
    }

    const fetchCourses = async () => {
      const courseQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', selectedInstitution)
      );
      const courseSnapshot = await getDocs(courseQuery);
      setCourses(courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCourses();
  }, [selectedInstitution]);

  // Fetch applications from CORRECT collection
  useEffect(() => {
    if (!selectedCourse) {
      setApplications([]);
      return;
    }

    const fetchApplications = async () => {
      // ✅ FIXED: Use 'courseApplications' (not 'applications')
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
        apps.push({
          id: appDoc.id,
          studentId: appData.studentId,
          studentEmail: studentSnap.exists() ? studentSnap.data().email : 'Unknown',
          studentName: studentSnap.exists() 
            ? `${studentSnap.data().firstName || ''} ${studentSnap.data().lastName || ''}`.trim() 
            : 'Unknown',
          status: appData.status || 'Pending',
          gpa: studentSnap.exists() ? studentSnap.data().gpa : 0
        });
      }
      setApplications(apps);
    };
    fetchApplications();
  }, [selectedCourse]);

  const handlePublish = async () => {
    if (applications.length === 0) {
      setMessage('No applications to publish.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const courseName = courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course';
      const institutionName = institutions.find(i => i.id === selectedInstitution)?.name || 'N/A';

      // ✅ Update each student with ARRAY-BASED admission (fixes .map error)
      const studentUpdatePromises = applications.map(async (app) => {
        const studentRef = doc(db, 'students', app.studentId);
        const studentSnap = await getDoc(studentRef);
        const currentData = studentSnap.exists() ? studentSnap.data() : {};
        const currentAdmissions = Array.isArray(currentData.admittedInstitutions) 
          ? currentData.admittedInstitutions 
          : [];

        // Avoid duplicates
        const exists = currentAdmissions.some(inst => inst.id === selectedCourse);
        if (!exists) {
          await updateDoc(studentRef, {
            admittedInstitutions: arrayUnion({
              id: selectedCourse,
              institutionId: selectedInstitution,
              name: institutionName,
              program: courseName,
              status: 'Admitted'
            })
          });
        }
      });

      await Promise.all(studentUpdatePromises);

      // Optional: Mark applications as published
      const publishPromises = applications.map(app =>
        updateDoc(doc(db, 'courseApplications', app.id), { status: 'Published' })
      );
      await Promise.all(publishPromises);

      setMessage('✅ Admission results published successfully!');
    } catch (error) {
      console.error('Publish error:', error);
      setMessage('❌ Failed to publish admissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Publish Admissions</h2>
        <p>Select an institution and course to publish admission results.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <div className="lo-form-row">
        <div className="lo-form-group">
          <label>Institution</label>
          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="lo-form-control"
          >
            <option value="">Select Institution</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>

        <div className="lo-form-group">
          <label>Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedInstitution}
            className="lo-form-control"
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              // ✅ FIXED: Use 'name' (not 'program')
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse && (
        <div className="lo-section" style={{ marginTop: '24px' }}>
          <div className="lo-section-header">
            <h3>Applications ({applications.length})</h3>
          </div>
          {applications.length === 0 ? (
            <div className="lo-no-data">No applications found for this course.</div>
          ) : (
            <div className="lo-table-container">
              <table className="lo-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>GPA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td>{app.studentName || app.studentEmail}</td>
                      <td>{app.studentEmail}</td>
                      <td>{app.gpa ? app.gpa.toFixed(2) : 'N/A'}</td>
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
          )}

          <button
            className="lo-btn lo-btn-primary"
            onClick={handlePublish}
            disabled={loading || applications.length === 0}
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Publishing...' : 'Publish Admission Results'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PublishAdmissions;