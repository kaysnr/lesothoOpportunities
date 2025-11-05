// src/components/student/Profile.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './StudentDashboard.css';

// ✅ Move symbolToPoints OUTSIDE the component (so it's stable)
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

  // Removed symbolToPoints from inside component

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
      if (studentData.transcriptUrl) {
        setTranscriptFileName(studentData.transcriptFileName || 'Transcript uploaded');
      }
    }
  }, [studentData]);

  // ✅ Now safe: SYMBOL_TO_POINTS is stable, no need in deps
  useEffect(() => {
    if (subjects.length > 0) {
      const totalPoints = subjects.reduce((sum, subj) => {
        return sum + (SYMBOL_TO_POINTS[subj.symbol] || 0);
      }, 0);
      const avg = totalPoints / subjects.length;
      setGpa(parseFloat(avg.toFixed(2)));
    } else {
      setGpa(0);
    }
  }, [subjects]); // ✅ No warning — SYMBOL_TO_POINTS is constant

  const handleAddSubject = () => {
    if (newSubject.name && newSubject.symbol) {
      setSubjects([...subjects, newSubject]);
      setNewSubject({ name: '', symbol: '' });
    }
  };

  const handleRemoveSubject = (index) => {
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await updateDoc(doc(db, 'students', studentId), {
        ...formData,
        subjects,
        gpa: Number(gpa),
        updatedAt: new Date(),
      });

      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      setMessage('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="profile-editor">
      <h2>My Profile</h2>
      {message && (
        <div className={`profile-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Profile Picture Upload */}
        <div className="form-group upload-section">
          <label>Profile Picture</label>
          <div className="upload-box">
            {profilePicturePreview ? (
              <img src={profilePicturePreview} alt="Profile preview" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <i className="fas fa-user-circle upload-icon"></i>
                <p>No image selected</p>
              </div>
            )}
            <label className="upload-btn">
              Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setProfilePicturePreview(URL.createObjectURL(file));
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <p className="upload-hint">Recommended: JPG/PNG, max 2MB</p>
        </div>

        {/* Transcript Upload */}
        <div className="form-group upload-section">
          <label>Academic Transcript or Certificate (PDF)</label>
          <div className="upload-box file-upload">
            {transcriptFileName ? (
              <div className="file-preview">
                <i className="fas fa-file-pdf pdf-icon"></i>
                <span>{transcriptFileName}</span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <i className="fas fa-file-upload upload-icon"></i>
                <p>No file selected</p>
              </div>
            )}
            <label className="upload-btn">
              Choose PDF
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setTranscriptFileName(file.name);
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <p className="upload-hint">Only PDF files allowed</p>
        </div>

        {/* Basic Info */}
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Education Level</label>
          <input
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            placeholder="e.g., High School, Bachelor's Degree"
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows="3"
          />
        </div>

        {/* Subjects */}
        <div className="form-group">
          <label>Academic Subjects</label>
          <div className="subjects-input">
            <input
              placeholder="Subject name"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            />
            <select
              value={newSubject.symbol}
              onChange={(e) => setNewSubject({ ...newSubject, symbol: e.target.value })}
            >
              <option value="">Select Grade</option>
              {Object.keys(SYMBOL_TO_POINTS).map((sym) => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddSubject} className="add-subject-btn">
              Add
            </button>
          </div>

          <div className="subjects-list">
            {subjects.map((subj, i) => (
              <div key={i} className="subject-item">
                <span>{subj.name} — <strong>{subj.symbol}</strong></span>
                <button type="button" onClick={() => handleRemoveSubject(i)} className="remove-subject">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {subjects.length > 0 && (
          <div className="gpa-display">
            <strong>Calculated GPA:</strong> {gpa} / 4.0
          </div>
        )}

        <button type="submit" className="save-btn">Save Profile</button>
      </form>
    </div>
  );
};

export default Profile;