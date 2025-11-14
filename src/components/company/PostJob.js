// src/components/company/PostJob.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
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
    setFormData(prev => ({ ...prev, [name]: value }));
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

      setMessage('✅ Job posted successfully!');
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
    } catch (err) {
      console.error('Post job error:', err);
      setMessage('❌ Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch company's jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!companyId) return;
      setLoadingJobs(true);
      try {
        const jobsQuery = query(collection(db, 'jobs'), where('companyId', '==', companyId));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          postedAt: doc.data().postedAt?.toDate ? doc.data().postedAt.toDate() : new Date()
        }));
        setJobs(jobList);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [companyId]);

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-bullhorn"></i>
          Post & Manage Jobs
        </h2>
        <p>Create new job posts and track applicant statistics.</p>
      </div>

      {/* Stats Summary */}
      {jobs.length > 0 && (
        <div className="lo-stats-cards">
          <div className="lo-stat-card">
            <div className="lo-stat-value">{jobs.length}</div>
            <div className="lo-stat-label">Jobs Posted</div>
          </div>
          <div className="lo-stat-card">
            <div className="lo-stat-value">
              {jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0)}
            </div>
            <div className="lo-stat-label">Total Applicants</div>
          </div>
          <div className="lo-stat-card approved">
            <div className="lo-stat-value">
              {jobs.filter(j => j.isActive).length}
            </div>
            <div className="lo-stat-label">Active Jobs</div>
          </div>
        </div>
      )}

      {/* Post Job Form */}
      <div className="lo-card">
        <h3 className="lo-card-title">
          <i className="fas fa-plus"></i>
          Post a New Job
        </h3>
        {message && (
          <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="lo-form">
          <div className="lo-form-row">
            <div className="lo-form-group">
              <label>Job Title *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Software Engineer"
                className="lo-form-control"
              />
            </div>
            <div className="lo-form-group">
              <label>Location *</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., Maseru or Remote"
                className="lo-form-control"
              />
            </div>
          </div>

          <div className="lo-form-row">
            <div className="lo-form-group">
              <label>Salary (L) *</label>
              <input
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                placeholder="e.g., 15,000"
                className="lo-form-control"
              />
            </div>
            <div className="lo-form-group">
              <label>Type *</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange}
                className="lo-form-control"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="lo-form-group">
            <label>Job Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              placeholder="Describe responsibilities, expectations, and benefits..."
              className="lo-form-control"
            />
          </div>

          <h4 className="lo-section-title">Qualification Requirements</h4>

          <div className="lo-form-group">
            <label>Minimum GPA (Optional)</label>
            <input
              type="number"
              step="0.01"
              name="minGPA"
              value={formData.minGPA}
              onChange={handleChange}
              min="0"
              max="4"
              placeholder="e.g., 2.5"
              className="lo-form-control"
            />
            <p className="lo-hint">
              <i className="fas fa-info-circle"></i> Leave blank for no GPA requirement
            </p>
          </div>

          <div className="lo-form-group">
            <label>Required Certificates</label>
            <textarea
              name="requiredCertificates"
              value={formData.requiredCertificates}
              onChange={handleChange}
              placeholder="e.g., AWS Certified, Cisco CCNA, Microsoft Azure"
              className="lo-form-control"
              rows="2"
            />
            <p className="lo-hint">
              <i className="fas fa-info-circle"></i> Separate certificates with commas
            </p>
          </div>

          <div className="lo-form-group">
            <label>Required Work Experience (Years)</label>
            <input
              type="number"
              name="requiredExperience"
              value={formData.requiredExperience}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 2"
              className="lo-form-control"
            />
          </div>

          <div className="lo-form-actions">
            <button 
              type="submit" 
              className="lo-btn lo-btn-primary" 
              disabled={loading}
              aria-busy={loading}
            >
              <i className="fas fa-paper-plane"></i>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>

      {/* Jobs Table */}
      {jobs.length > 0 && (
        <div className="lo-card" style={{ marginTop: '32px' }}>
          <div className="lo-section-header">
            <h3>
              <i className="fas fa-list"></i>
              Your Posted Jobs ({jobs.length})
            </h3>
          </div>

          {loadingJobs ? (
            <div className="lo-no-data">
              <div className="lo-spinner"></div>
              <p>Loading jobs...</p>
            </div>
          ) : (
            <div className="lo-table-container">
              <table className="lo-table">
                <thead>
                  <tr>
                    <th>Job</th>
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
                      <td>
                        <strong>{job.title}</strong>
                      </td>
                      <td>{job.type}</td>
                      <td>{job.location}</td>
                      <td>{job.minGPA ? Number(job.minGPA).toFixed(2) : '—'}</td>
                      <td>
                        <span className="lo-badge lo-badge-info">
                          {job.applicantCount || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`lo-status ${job.isActive ? 'approved' : 'suspended'}`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {job.postedAt?.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostJob;