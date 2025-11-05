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

  useEffect(() => {
    const fetchJobs = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, 'jobs'), where('companyId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const jobList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobList);
    };

    fetchJobs();
  }, []);

  const fetchApplicants = async (jobId) => {
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (!jobDoc.exists()) return;
      const job = jobDoc.data();

      const applicationsQuery = query(collection(db, 'applications'), where('jobId', '==', jobId));
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicantsList = [];

      for (const appDoc of applicationsSnapshot.docs) {
        const appData = appDoc.data();
        const studentDoc = await getDoc(doc(db, 'students', appData.studentId));
        if (studentDoc.exists()) {
          const student = studentDoc.data();

          const isQualified = 
            (!job.minGPA || (student.gpa !== undefined && student.gpa >= job.minGPA)) &&
            (!job.requiredCertificates || 
              job.requiredCertificates
                .split(',')
                .map(c => c.trim())
                .every(cert => 
                  (student.certificates || []).some(c => 
                    c.toLowerCase().includes(cert.toLowerCase().trim())
                  )
                )
            ) &&
            (!job.requiredExperience || 
              (student.workExperience || 0) >= Number(job.requiredExperience)
            );

          applicantsList.push({
            id: appDoc.id,
            studentId: appData.studentId,
            student,
            appliedAt: appData.appliedAt,
            status: appData.status || 'Pending',
            isQualified
          });
        }
      }

      setApplicants(applicantsList);
      setSelectedJob(jobId);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle accept/reject
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status: newStatus,
        reviewedAt: new Date()
      });

      // ✅ Update local state
      setApplicants(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status.');
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="lo-institute-module">
        <div className="lo-module-header">
          <h2>View Applicants</h2>
        </div>
        <p>
          You haven't posted any jobs yet.{' '}
          <button 
            className="lo-link-btn"
            onClick={() => {
              const sidebarLink = document.querySelector('[data-view="post-job"]');
              if (sidebarLink) sidebarLink.click();
            }}
          >
            Post a job
          </button>{' '}
          to start receiving applications.
        </p>
      </div>
    );
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>View All Applicants</h2>
        <p>Review and manage job applications</p>
      </div>

      <div className="lo-form-group" style={{ marginBottom: '24px' }}>
        <label>Select Job</label>
        <select 
          onChange={(e) => e.target.value && fetchApplicants(e.target.value)} 
          value={selectedJob || ''}
          className="lo-form-control"
        >
          <option value="">Choose a job</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title} — {job.location || 'Remote'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="lo-no-data">Loading applicants...</div>
      ) : selectedJob ? (
        applicants.length > 0 ? (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>GPA</th>
                  <th>Qualified</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map(app => (
                  <tr key={app.id}>
                    <td>{app.student.firstName} {app.student.lastName}</td>
                    <td>{app.student.email}</td>
                    <td>
                      {app.student.gpa !== undefined 
                        ? Number(app.student.gpa).toFixed(2) 
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`lo-status ${app.isQualified ? 'approved' : 'suspended'}`}>
                        {app.isQualified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      {app.appliedAt?.toDate 
                        ? app.appliedAt.toDate().toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`lo-status ${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      {app.status === 'Pending' ? (
                        <>
                          <button
                            className="lo-table-btn lo-btn-success"
                            onClick={() => updateApplicationStatus(app.id, 'Accepted')}
                            style={{ marginRight: '8px' }}
                          >
                            Accept
                          </button>
                          <button
                            className="lo-table-btn lo-btn-danger"
                            onClick={() => updateApplicationStatus(app.id, 'Rejected')}
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
        ) : (
          <div className="lo-no-data">No applicants found for this job.</div>
        )
      ) : (
        <div className="lo-no-data">Select a job to view applicants.</div>
      )}
    </div>
  );
};

export default ViewApplicants;