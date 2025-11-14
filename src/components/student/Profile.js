// src/components/student/Profile.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const SYMBOL_TO_POINTS = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const Profile = ({ studentId, studentData }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    education: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: '', symbol: '' });
  const [gpa, setGpa] = useState(0);
  const [message, setMessage] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [loading, setLoading] = useState(false); // ✅ Added loading state

  useEffect(() => {
    if (studentData) {
      setFormData({
        firstName: studentData.firstName || '',
        lastName: studentData.lastName || '',
        phone: studentData.phone || '',
        address: studentData.address || '',
        education: studentData.education || ''
      });
      setSubjects(studentData.subjects || []);
      if (studentData.profilePictureUrl) {
        setProfilePicturePreview(studentData.profilePictureUrl);
      }
      if (studentData.transcriptFileName) {
        setTranscriptFileName(studentData.transcriptFileName);
      }
    }
  }, [studentData]);

  useEffect(() => {
    if (subjects.length > 0) {
      const totalPoints = subjects.reduce((sum, subj) => sum + (SYMBOL_TO_POINTS[subj.symbol] || 0), 0);
      setGpa(parseFloat((totalPoints / subjects.length).toFixed(2)));
    } else {
      setGpa(0);
    }
  }, [subjects]);

  const handleAddSubject = () => {
    if (newSubject.name && newSubject.symbol && SYMBOL_TO_POINTS[newSubject.symbol]) {
      setSubjects([...subjects, newSubject]);
      setNewSubject({ name: '', symbol: '' });
    }
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true); // ✅ Start loading

    try {
      await updateDoc(doc(db, 'students', studentId), {
        ...formData,
        subjects,
        gpa: Number(gpa),
        updatedAt: new Date(),
      });
      setMessage('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      setMessage('❌ Failed to update profile. Please try again.');
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfilePicturePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTranscriptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTranscriptFileName(file.name);
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-user-cog"></i> My Profile
        </h2>
        <p>Update your personal and academic information</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="lo-form">
        {/* Profile Picture Upload */}
        <div className="lo-form-group">
          <label>Profile Picture</label>
          <div className="lo-upload-box">
            {profilePicturePreview ? (
              <img src={profilePicturePreview} alt="Profile preview" className="lo-upload-preview" />
            ) : (
              <div className="lo-upload-placeholder">
                <i className="fas fa-user-circle lo-upload-icon"></i>
                <p>No image selected</p>
              </div>
            )}
            <label className="lo-upload-btn">
              Choose Image
              <input type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: 'none' }} />
            </label>
          </div>
          <p className="lo-upload-hint">JPG/PNG, max 2MB</p>
        </div>

        {/* Transcript Upload */}
        <div className="lo-form-group">
          <label>Academic Transcript or Certificate (PDF)</label>
          <div className="lo-upload-box lo-file-upload">
            {transcriptFileName ? (
              <div className="lo-file-preview">
                <i className="fas fa-file-pdf lo-pdf-icon"></i>
                <span>{transcriptFileName}</span>
              </div>
            ) : (
              <div className="lo-upload-placeholder">
                <i className="fas fa-file-upload lo-upload-icon"></i>
                <p>No file selected</p>
              </div>
            )}
            <label className="lo-upload-btn">
              Choose PDF
              <input type="file" accept=".pdf" onChange={handleTranscriptChange} style={{ display: 'none' }} />
            </label>
          </div>
          <p className="lo-upload-hint">PDF files only</p>
        </div>

        {/* Basic Info */}
        <div className="lo-form-row">
          <div className="lo-form-group">
            <label>First Name *</label>
            <input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="lo-form-control"
            />
          </div>
          <div className="lo-form-group">
            <label>Last Name *</label>
            <input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="lo-form-control"
            />
          </div>
        </div>

        <div className="lo-form-group">
          <label>Education Level</label>
          <input
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            placeholder="e.g., High School, Bachelor's Degree"
            className="lo-form-control"
          />
        </div>

        <div className="lo-form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="lo-form-control"
          />
        </div>

        <div className="lo-form-group">
          <label>Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows="3"
            className="lo-form-control"
          />
        </div>

        {/* Subjects */}
        <div className="lo-form-group">
          <label>Academic Subjects</label>
          <div className="lo-subjects-input">
            <input
              placeholder="Subject name"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="lo-form-control"
            />
            <select
              value={newSubject.symbol}
              onChange={(e) => setNewSubject({ ...newSubject, symbol: e.target.value })}
              className="lo-form-control"
            >
              <option value="">Select Grade</option>
              {Object.keys(SYMBOL_TO_POINTS).map((sym) => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddSubject} className="lo-btn lo-btn-secondary">
              Add
            </button>
          </div>

          <div className="lo-subjects-list">
            {subjects.map((subj, i) => (
              <div key={i} className="lo-subject-item">
                <span>{subj.name} — <strong>{subj.symbol}</strong></span>
                <button type="button" onClick={() => handleRemoveSubject(i)} className="lo-remove-subject">×</button>
              </div>
            ))}
          </div>
        </div>

        {subjects.length > 0 && (
          <div className="lo-gpa-display">
            <strong>Calculated GPA:</strong> {gpa} / 4.0
          </div>
        )}

        <div className="lo-form-actions">
          <button type="submit" className="lo-btn lo-btn-primary" disabled={loading}>
            <i className="fas fa-save"></i> Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
