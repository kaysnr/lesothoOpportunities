// src/components/company/ViewApplicants.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const ViewApplicants = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(collection(db, 'jobs'), where('companyId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const jobList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          postedAt: doc.data().postedAt?.toDate ? doc.data().postedAt.toDate() : null
        }));
        setJobs(jobList);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setMessage('❌ Failed to load jobs.');
      }
    };

    fetchJobs();
  }, []);

  const fetchApplicants = async (jobId) => {
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (!jobDoc.exists()) {
        setMessage('Job not found.');
        return;
      }
      const job = jobDoc.data();

      const applicationsQuery = query(collection(db, 'applications'), where('jobId', '==', jobId));
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicantsList = [];

      for (const appDoc of applicationsSnapshot.docs) {
        const appData = appDoc.data();
        const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
        if (studentDoc.exists()) {
          const student = studentDoc.data();

          // ✅ Qualification logic (same as your original)
          const isQualified = 
            (!job.minGPA || (student.gpa !== undefined && parseFloat(student.gpa) >= parseFloat(job.minGPA))) &&
            (!job.requiredCertificates || 
              job.requiredCertificates
                .split(',')
                .map(c => c.trim().toLowerCase())
                .every(cert => 
                  (student.certificates || []).some(c => 
                    c.toLowerCase().includes(cert)
                  )
                )
            ) &&
            (!job.requiredExperience || 
              (student.workExperience || 0) >= parseInt(job.requiredExperience) || 0
            );

          applicantsList.push({
            id: appDoc.id,
            studentId: appDoc.id,
            student,
            appliedAt: appData.appliedAt,
            status: appData.status || 'Pending',
            isQualified
          });
        }
      }

      setApplicants(applicantsList);
      setSelectedJob(jobId);
      setMessage('');
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setMessage('❌ Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status: newStatus,
        reviewedAt: new Date()
      });

      setApplicants(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('❌ Failed to update application status.');
    }
  };

  const job = jobs.find(j => j.id === selectedJob);

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-users"></i>
          View Applicants
        </h2>
        <p>Review and manage job applications</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('❌') ? 'lo-alert-error' : 'lo-alert-warning'}`}>
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="lo-no-data">
          <i className="fas fa-bullhorn"></i>
          <p>You haven’t posted any jobs yet.</p>
          <button 
            className="lo-btn lo-btn-secondary"
            onClick={() => {
              const event = new CustomEvent('navigate', { detail: 'post-job' });
              window.dispatchEvent(event);
            }}
            style={{ marginTop: '16px' }}
          >
            <i className="fas fa-plus"></i> Post Your First Job
          </button>
        </div>
      ) : (
        <>
          <div className="lo-form-group">
            <label>Select Job *</label>
            <select 
              onChange={(e) => e.target.value && fetchApplicants(e.target.value)} 
              value={selectedJob || ''}
              className="lo-form-control"
              required
            >
              <option value="">Choose a job</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.location || 'Remote'}
                </option>
              ))}
            </select>
          </div>

          {selectedJob && job && (
            <div className="lo-card" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h4>{job.title}</h4>
                  <p style={{ margin: '4px 0', color: 'var(--lo-text-muted)' }}>
                    <i className="fas fa-map-marker-alt"></i> {job.location}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="lo-badge lo-badge-info">
                    {applicants.length} applicants
                  </div>
                  <div className="lo-badge lo-badge-success">
                    {applicants.filter(a => a.isQualified).length} Qualified
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="lo-no-data">
              <div className="lo-spinner"></div>
              <p>Loading applicants...</p>
            </div>
          ) : selectedJob ? (
            applicants.length > 0 ? (
              <div className="lo-table-container">
                <table className="lo-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>GPA</th>
                      <th>Certificates</th>
                      <th>Experience</th>
                      <th>Qualified</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map(app => (
                      <tr key={app.id} className={app.isQualified ? 'lo-row-qualified' : ''}>
                        <td>
                          <strong>{app.student.firstName} {app.student.lastName}</strong>
                        </td>
                        <td>{app.student.email}</td>
                        <td>
                          {app.student.gpa !== undefined 
                            ? Number(app.student.gpa).toFixed(2) 
                            : '—'}
                        </td>
                        <td>
                          {(app.student.certificates || []).length > 0 
                            ? (app.student.certificates || []).join(', ').substring(0, 20) + 
                              ((app.student.certificates || []).join(', ').length > 20 ? '…' : '')
                            : '—'}
                        </td>
                        <td>
                          {app.student.workExperience !== undefined 
                            ? `${app.student.workExperience} yrs`
                            : '—'}
                        </td>
                        <td>
                          <span className={`lo-status ${app.isQualified ? 'approved' : 'suspended'}`}>
                            {app.isQualified ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
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
                            <>
                              <button
                                className="lo-table-btn lo-btn-success"
                                onClick={() => updateApplicationStatus(app.id, 'Accepted')}
                              >
                                <i className="fas fa-check"></i> Accept
                              </button>
                              <button
                                className="lo-table-btn lo-btn-danger"
                                onClick={() => updateApplicationStatus(app.id, 'Rejected')}
                                style={{ marginLeft: '6px' }}
                              >
                                <i className="fas fa-times"></i> Reject
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
            ) : (
              <div className="lo-no-data">
                <i className="fas fa-users"></i>
                <p>No applicants found for <strong>{job?.title || 'this job'}</strong>.</p>
                <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
                  Students will apply once your job is visible on the platform.
                </p>
              </div>
            )
          ) : (
            <div className="lo-no-data">
              <i className="fas fa-filter"></i>
              <p>Select a job to view applicants.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewApplicants;