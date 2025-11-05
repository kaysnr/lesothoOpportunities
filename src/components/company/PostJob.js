// src/components/company/PostJob.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const PostJob = ({ companyId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    type: 'Full-time',
    minGPA: '',
    requiredCertificates: '',
    requiredExperience: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await addDoc(collection(db, 'jobs'), {
        ...formData,
        companyId: companyId || user.uid,
        companyName: user.displayName || 'Company',
        isActive: true,
        postedAt: new Date()
      });

      setFormData({
        title: '',
        description: '',
        location: '',
        salary: '',
        type: 'Full-time',
        minGPA: '',
        requiredCertificates: '',
        requiredExperience: ''
      });
      setMessage('Job posted successfully!');
    } catch (err) {
      console.error('Post job error:', err);
      setMessage('Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch company's jobs and applicant counts
  useEffect(() => {
    const fetchJobsWithApplicants = async () => {
      if (!companyId) return;

      setLoadingJobs(true);
      try {
        // 1. Get all jobs by this company
        const jobsQuery = query(collection(db, 'jobs'), where('companyId', '==', companyId));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 2. For each job, count applications
        const jobsWithCounts = await Promise.all(
          jobList.map(async (job) => {
            const appsQuery = query(collection(db, 'applications'), where('jobId', '==', job.id));
            const appSnapshot = await getDocs(appsQuery);
            return {
              ...job,
              applicantCount: appSnapshot.size
            };
          })
        );

        setJobs(jobsWithCounts);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobsWithApplicants();
  }, [companyId]);

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Post & Manage Job Opportunities</h2>
        <p>Create new job posts and view applicant statistics.</p>
      </div>

      {/* Post Job Form */}
      <div className="lo-card">
        <h3>Post a New Job</h3>
        {message && <div className="lo-alert lo-alert-success">{message}</div>}
        <form onSubmit={handleSubmit} className="lo-form">
          <div className="lo-form-row">
            <div className="lo-form-group">
              <label>Job Title</label>
              <input name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="lo-form-group">
              <label>Location</label>
              <input name="location" value={formData.location} onChange={handleChange} required />
            </div>
          </div>

          <div className="lo-form-row">
            <div className="lo-form-group">
              <label>Salary (L)</label>
              <input name="salary" value={formData.salary} onChange={handleChange} required />
            </div>
            <div className="lo-form-group">
              <label>Employment Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="lo-form-group">
            <label>Job Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <h4>Qualification Requirements</h4>
          <div className="lo-form-group">
            <label>Minimum GPA (Optional)</label>
            <input
              type="number"
              step="0.1"
              name="minGPA"
              value={formData.minGPA}
              onChange={handleChange}
              min="0"
              max="4"
            />
          </div>

          <div className="lo-form-group">
            <label>Required Certificates</label>
            <textarea
              name="requiredCertificates"
              value={formData.requiredCertificates}
              onChange={handleChange}
              placeholder="e.g., AWS Certified, Cisco CCNA"
            />
          </div>

          <div className="lo-form-group">
            <label>Required Work Experience (Years)</label>
            <input
              type="number"
              name="requiredExperience"
              value={formData.requiredExperience}
              onChange={handleChange}
              min="0"
            />
          </div>

          <button type="submit" className="lo-btn lo-btn-primary" disabled={loading}>
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="lo-card" style={{ marginTop: '32px' }}>
        <div className="lo-section-header">
          <h3>Posted Jobs</h3>
        </div>

        {loadingJobs ? (
          <div className="lo-no-data">Loading your job posts...</div>
        ) : jobs.length === 0 ? (
          <div className="lo-no-data">You haven’t posted any jobs yet.</div>
        ) : (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Min GPA</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Posted</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.type}</td>
                    <td>{job.location}</td>
                    <td>{job.minGPA ? job.minGPA.toFixed(2) : 'N/A'}</td>
                    <td>
                      <span className="lo-badge lo-badge-info">
                        {job.applicantCount}
                      </span>
                    </td>
                    <td>
                      <span className={`lo-status ${job.isActive ? 'approved' : 'suspended'}`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {job.postedAt?.toDate
                        ? job.postedAt.toDate().toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostJob;