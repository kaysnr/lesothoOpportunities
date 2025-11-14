// src/components/institute/ManageFaculties.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const ManageFaculties = () => {
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({ name: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, 'faculties'), where('institutionId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const facultyList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null
      }));
      setFaculties(facultyList);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setMessage('Failed to load faculties.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    setLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      if (editingId) {
        await updateDoc(doc(db, 'faculties', editingId), { name: trimmedName });
        setMessage('Faculty updated successfully!');
      } else {
        await addDoc(collection(db, 'faculties'), {
          name: trimmedName,
          institutionId: user.uid,
          createdAt: new Date()
        });
        setMessage('Faculty added successfully!');
      }

      setForm({ name: '' });
      setEditingId(null);
      await fetchFaculties();
    } catch (err) {
      console.error('Save error:', err);
      setMessage('Failed to save faculty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    setForm({ name: faculty.name });
    setEditingId(faculty.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'faculties', id));
      setMessage('Faculty deleted.');
      await fetchFaculties();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Failed to delete faculty.');
    }
  };

  const handleCancel = () => {
    setForm({ name: '' });
    setEditingId(null);
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-graduation-cap"></i>
          Manage Faculties
        </h2>
        <p>Add, edit, or remove academic faculties for your institution.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('successfully') || message.includes('deleted') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          <i className={`fas ${message.includes('successfully') || message.includes('deleted') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message}
        </div>
      )}

      {/* Faculty Form */}
      <div className="lo-card">
        <h3 className="lo-card-title">
          <i className={editingId ? "fas fa-edit" : "fas fa-plus"}></i>
          {editingId ? 'Edit Faculty' : 'Add New Faculty'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="lo-form-group">
            <label>Faculty Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="e.g., Faculty of Engineering"
              required
              className="lo-form-control"
            />
          </div>
          <div className="lo-form-actions">
            <button
              type="submit"
              className="lo-btn lo-btn-primary"
              disabled={loading || !form.name.trim()}
            >
              <i className="fas fa-save"></i>
              {loading ? 'Saving...' : editingId ? 'Update Faculty' : 'Add Faculty'}
            </button>
            {editingId && (
              <button
                type="button"
                className="lo-btn lo-btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Faculties List */}
      <div className="lo-section mt-4">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-list"></i>
            Existing Faculties ({faculties.length})
          </h3>
        </div>

        {faculties.length === 0 ? (
          <div className="lo-no-data">
            <i className="fas fa-graduation-cap"></i>
            <p>No faculties have been added yet.</p>
            <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
              Start by adding your first faculty above.
            </p>
          </div>
        ) : (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Created</th>
                  <th style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty) => (
                  <tr key={faculty.id}>
                    <td>
                      <strong>{faculty.name}</strong>
                    </td>
                    <td>
                      {faculty.createdAt 
                        ? faculty.createdAt.toLocaleDateString('en-GB', {
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
                          onClick={() => handleEdit(faculty)}
                          title="Edit faculty"
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button
                          className="lo-table-btn lo-btn-danger"
                          onClick={() => handleDelete(faculty.id, faculty.name)}
                          title="Delete faculty"
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
        )}
      </div>
    </div>
  );
};

export default ManageFaculties;