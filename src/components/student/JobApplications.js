// src/components/student/JobApplications.js
import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, query, where, doc, getDoc, addDoc, arrayUnion, updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const JobApplications = ({ studentId }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentGPA, setStudentGPA] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const studentData = studentDoc.data();
        setStudentGPA(studentData?.gpa || 0);

        const jobsQuery = query(collection(db, 'jobs'), where('isActive', '==', true));
        const jobSnapshot = await getDocs(jobsQuery);
        const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const appsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', studentId)
        );
        const appsSnapshot = await getDocs(appsQuery);
        const appStatus = {};
        appsSnapshot.forEach(doc => {
          const data = doc.data();
          appStatus[data.jobId] = {
            id: doc.id,
            status: data.status || 'Pending'
          };
        });

        setJobs(jobList);
        setApplications(appStatus);
      } catch (error) {
        console.error('Error fetching jobs/applications:', error);
        setMessage('❌ Failed to load job opportunities.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const isQualified = (job) => {
    return !job.minGPA || studentGPA >= job.minGPA;
  };

  const handleApply = async (jobId) => {
    if (applications[jobId]) return;

    try {
      const newAppRef = await addDoc(collection(db, 'applications'), {
        studentId,
        jobId,
        appliedAt: new Date(),
        status: 'Pending'
      });

      await updateDoc(doc(db, 'students', studentId), {
        appliedJobs: arrayUnion(jobId)
      });

      await updateDoc(doc(db, 'jobs', jobId), {
        applicants: arrayUnion(studentId)
      });

      setApplications(prev => ({
        ...prev,
        [jobId]: { id: newAppRef.id, status: 'Pending' }
      }));

      setMessage('✅ Application submitted successfully!');
    } catch (error) {
      console.error('Apply failed:', error);
      setMessage('❌ Failed to apply. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="lo-institute-module">
        <div className="lo-module-header">
          <h2>
            <i className="fas fa-briefcase"></i>
            Job Opportunities
          </h2>
        </div>
        <div className="lo-no-data">
          <div className="lo-spinner"></div>
          <p>Loading job opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-briefcase"></i>
          Job Opportunities
        </h2>
        <p>
          {jobs.length} active jobs • Your GPA: <strong>{studentGPA.toFixed(2)}</strong>
        </p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="lo-no-data">
          <i className="fas fa-search"></i>
          <p>No job opportunities are currently available.</p>
          <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
            Check back later or contact support.
          </p>
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>
                  <i className="fas fa-graduation-cap" title="Minimum GPA"></i> Min GPA
                </th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const app = applications[job.id];
                const qualified = isQualified(job);
                const status = app?.status || 'Eligible';

                return (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.title}</strong>
                      {!qualified && (
                        <span className="lo-badge lo-badge-warning" style={{ marginLeft: '8px' }}>
                          <i className="fas fa-exclamation-triangle"></i> Requires {job.minGPA}
                        </span>
                      )}
                    </td>
                    <td>{job.companyName || '—'}</td>
                    <td>{job.location || 'Remote'}</td>
                    <td>
                      {job.minGPA ? Number(job.minGPA).toFixed(2) : '—'}
                    </td>
                    <td>
                      {app ? (
                        <span className={`lo-status ${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      ) : qualified ? (
                        <span className="lo-status pending">Eligible</span>
                      ) : (
                        <span className="lo-status suspended">Not Eligible</span>
                      )}
                    </td>
                    <td>
                      {app ? (
                        <span className="lo-status approved">Applied</span>
                      ) : qualified ? (
                        <button
                          className="lo-table-btn lo-btn-success"
                          onClick={() => handleApply(job.id)}
                        >
                          <i className="fas fa-paper-plane"></i> Apply
                        </button>
                      ) : (
                        <button
                          className="lo-table-btn lo-btn-disabled"
                          disabled
                          title={`Your GPA (${studentGPA}) is below minimum (${job.minGPA})`}
                        >
                          GPA Too Low
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="lo-hint" style={{ marginTop: '24px' }}>
        <i className="fas fa-lightbulb"></i>
        <strong>Tip:</strong> Update your GPA and certificates in <strong>My Profile</strong> to qualify for more opportunities.
      </div>
    </div>
  );
};

export default JobApplications;