// src/components/admin/ManageInstitutions.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const ManageInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', location: '', contact: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'institutions'));
      setInstitutions(
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null
        }))
      );
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setMessage('❌ Failed to load institutions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = {
        ...formData,
        name: formData.name.trim(),
        isActive: true,
        createdAt: editingId ? undefined : new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'institutions', editingId), data);
        setMessage('✅ Institution updated successfully!');
      } else {
        await addDoc(collection(db, 'institutions'), data);
        setMessage('✅ Institution added successfully!');
      }

      setFormData({ name: '', email: '', location: '', contact: '' });
      setEditingId(null);
      await fetchInstitutions();
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ Failed to save institution.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (inst) => {
    setFormData({ 
      name: inst.name || '', 
      email: inst.email || '', 
      location: inst.location || '', 
      contact: inst.contact || '' 
    });
    setEditingId(inst.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will remove all associated faculties and courses.`)) return;

    try {
      await deleteDoc(doc(db, 'institutions', id));
      setMessage('✅ Institution deleted.');
      await fetchInstitutions();
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('❌ Failed to delete institution.');
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-university"></i>
          Manage Institutions
        </h2>
        <p>Add, edit, or remove educational institutions.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <div className="lo-card">
        <h3 className="lo-card-title">
          <i className={editingId ? "fas fa-edit" : "fas fa-plus"}></i>
          {editingId ? 'Edit Institution' : 'Add New Institution'}
        </h3>

        <form onSubmit={handleSubmit} className="lo-form">
          <div className="lo-form-group">
            <label>Institution Name *</label>
            <input
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              placeholder="e.g., National University of Lesotho"
              className="lo-form-control"
            />
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="lo-form-group">
                <label>Email *</label>
                <input
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  type="email"
                  placeholder="contact@institution.ls"
                  className="lo-form-control"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="lo-form-group">
                <label>Contact</label>
                <input
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  placeholder="+266 123 4567"
                  className="lo-form-control"
                />
              </div>
            </div>
          </div>
          <div className="lo-form-group">
            <label>Location</label>
            <input
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="e.g., Maseru, Lesotho"
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
              {loading ? 'Saving...' : editingId ? 'Update Institution' : 'Add Institution'}
            </button>
            {editingId && (
              <button
                type="button"
                className="lo-btn lo-btn-secondary"
                onClick={() => {
                  setFormData({ name: '', email: '', location: '', contact: '' });
                  setEditingId(null);
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {institutions.length > 0 && (
        <div className="lo-section mt-4">
          <div className="lo-section-header">
            <h3>
              <i className="fas fa-list"></i>
              Institutions ({institutions.length})
            </h3>
          </div>
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map(inst => (
                  <tr key={inst.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <strong>{inst.name}</strong>
                        {inst.logoUrl && (
                          <img 
                            src={inst.logoUrl} 
                            alt="Logo" 
                            className="ms-2"
                            style={{ 
                              height: '24px', 
                              width: '24px',
                              borderRadius: '4px',
                              objectFit: 'contain'
                            }} 
                          />
                        )}
                      </div>
                    </td>
                    <td>{inst.email}</td>
                    <td>{inst.location}</td>
                    <td>
                      {inst.createdAt 
                        ? inst.createdAt.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <button 
                          className="lo-table-btn lo-btn-warning"
                          onClick={() => handleEdit(inst)}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button 
                          className="lo-table-btn lo-btn-danger"
                          onClick={() => handleDelete(inst.id, inst.name)}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstitutions;