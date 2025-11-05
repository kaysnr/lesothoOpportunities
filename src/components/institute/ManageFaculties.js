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
      const facultyList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFaculties(facultyList);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setMessage('Failed to load faculties.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      if (editingId) {
        await updateDoc(doc(db, 'faculties', editingId), { name: form.name.trim() });
      } else {
        await addDoc(collection(db, 'faculties'), {
          name: form.name.trim(),
          institutionId: user.uid,
          createdAt: new Date()
        });
      }

      // Reset form
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty? This cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'faculties', id));
      await fetchFaculties();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete faculty.');
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
          <i className="fas fa-graduation-cap" style={{ marginRight: '12px' }}></i>
          Manage Faculties
        </h2>
        <p>Add, edit, or remove academic faculties for your institution.</p>
      </div>

      {message && (
        <div className="lo-alert lo-alert-error" style={{ marginBottom: '24px' }}>
          {message}
        </div>
      )}

      {/* Faculty Form */}
      <div className="lo-card" style={{ marginBottom: '32px' }}>
        <h3 className="lo-card-title">
          {editingId ? 'Edit Faculty' : 'Add New Faculty'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="lo-form-group">
            <label>Faculty Name</label>
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
              {loading ? 'Saving...' : editingId ? 'Update Faculty' : 'Add Faculty'}
            </button>
            {editingId && (
              <button
                type="button"
                className="lo-btn lo-btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Faculties Table */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-list" style={{ marginRight: '8px' }}></i>
            Existing Faculties ({faculties.length})
          </h3>
        </div>

        {faculties.length === 0 ? (
          <div className="lo-no-data">
            <i className="fas fa-graduation-cap" style={{ fontSize: '48px', marginBottom: '16px', color: '#cbd5e0' }}></i>
            <p>No faculties have been added yet.</p>
          </div>
        ) : (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty) => (
                  <tr key={faculty.id}>
                    <td>
                      <strong>{faculty.name}</strong>
                    </td>
                    <td>
                      {faculty.createdAt?.toDate
                        ? faculty.createdAt.toDate().toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="lo-table-btn lo-btn-warning"
                        onClick={() => handleEdit(faculty)}
                        title="Edit faculty"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        className="lo-table-btn lo-btn-danger"
                        onClick={() => handleDelete(faculty.id)}
                        title="Delete faculty"
                        style={{ marginLeft: '8px' }}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
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