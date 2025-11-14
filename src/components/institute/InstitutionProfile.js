// src/components/institute/InstitutionProfile.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const InstitutionProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    contact: '',
    website: '',
    description: '',
    location: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'institutions', user.uid));
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          } else {
            setMessage('Profile not found. Redirecting...');
            setTimeout(() => (window.location.href = '/'), 2000);
          }
        } catch (err) {
          setMessage('Failed to load profile.');
        }
      }
    };
    fetchProfile();
  }, []);

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
      if (user) {
        await updateDoc(doc(db, 'institutions', user.uid), {
          ...formData,
          isActive: true,
          updatedAt: new Date()
        });
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Update error:', err);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-user-cog"></i>
          Institution Profile
        </h2>
        <p>Update your institution's public information.</p>
      </div>

      {message && (
        <div 
          className={`lo-alert ${message.includes('successfully') ? 'lo-alert-success' : 'lo-alert-error'}`}
          role="alert"
        >
          <i className={`fas ${message.includes('successfully') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="lo-form">
        <div className="lo-form-group">
          <label>Institution Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., National University of Lesotho"
            className="lo-form-control"
          />
        </div>

        <div className="lo-form-group">
          <label data-optional>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@institution.ls"
            className="lo-form-control"
          />
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="lo-form-group">
              <label data-optional>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Maseru, Lesotho"
                className="lo-form-control"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="lo-form-group">
              <label data-optional>Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+266 123 4567"
                className="lo-form-control"
              />
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="lo-form-group">
              <label data-optional>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.institution.ls"
                className="lo-form-control"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="lo-form-group">
              <label data-optional>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="P.O. Box 123, Maseru"
                className="lo-form-control"
              />
            </div>
          </div>
        </div>

        <div className="lo-form-group">
          <label data-optional>Logo URL</label>
          <input
            type="url"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
            className="lo-form-control"
          />
          {formData.logoUrl && (
            <div className="text-center mt-3">
              <img 
                src={formData.logoUrl} 
                alt="Institution Logo" 
                className="img-fluid"
                style={{ 
                  maxHeight: '70px', 
                  maxWidth: '70px', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid var(--lo-border)',
                  backgroundColor: 'rgba(0,0,0,0.1)'
                }} 
              />
            </div>
          )}
        </div>

        <div className="lo-form-group">
          <label data-optional>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            placeholder="Briefly describe your institution, mission, and offerings..."
            className="lo-form-control"
          />
        </div>

        <div className="lo-form-actions">
          <button 
            type="submit" 
            className="lo-btn lo-btn-primary" 
            disabled={loading}
          >
            <i className="fas fa-save"></i>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstitutionProfile;