// src/components/company/CompanyProfile.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const CompanyProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    contact: '',
    industry: '',
    description: '',
    location: '',
    logoUrl: '' // ✅ Added logoUrl
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'companies', user.uid));
        if (docSnap.exists()) {
          setFormData(docSnap.data());
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
        await updateDoc(doc(db, 'companies', user.uid), {
          ...formData,
          isActive: true,        // ✅ Keep company visible on dashboard
          updatedAt: new Date()
        });
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lo-institute-module">
      <h2>Company Profile</h2>
      <p>Update your company's public information.</p>
      
      {message && (
        <div className={`lo-alert ${message.includes('successfully') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="lo-form">
        <div className="lo-form-group">
          <label>Company Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="lo-form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="lo-form-row">
          <div className="lo-form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div className="lo-form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="lo-form-group">
          <label>Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
          />
        </div>

        <div className="lo-form-group">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="lo-form-group">
          <label>Logo URL (optional)</label>
          <input
            type="url"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="lo-form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <button type="submit" className="lo-btn lo-btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default CompanyProfile;