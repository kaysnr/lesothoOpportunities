// src/components/admin/ManageFaculties.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const ManageFaculties = () => {
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [formData, setFormData] = useState({ name: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      fetchFaculties();
    }
  }, [selectedInstitution]);

  const fetchInstitutions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'institutions'));
      setInstitutions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setMessage('❌ Failed to load institutions.');
    }
  };

  const fetchFaculties = async () => {
    try {
      const q = query(collection(db, 'faculties'), where('institutionId', '==', selectedInstitution));
      const querySnapshot = await getDocs(q);
      setFaculties(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null
      })));
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingId) {
        await updateDoc(doc(db, 'faculties', editingId), { 
          name: formData.name.trim(),
          updatedAt: new Date()
        });
        setMessage('✅ Faculty updated successfully!');
      } else {
        await addDoc(collection(db, 'faculties'), {
          name: formData.name.trim(),
          institutionId: selectedInstitution,
          createdAt: new Date()
        });
        setMessage('✅ Faculty added successfully!');
      }

      setFormData({ name: '' });
      setEditingId(null);
      await fetchFaculties();
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ Failed to save faculty.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    setFormData({ name: faculty.name });
    setEditingId(faculty.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'faculties', id));
      setMessage('✅ Faculty deleted.');
      await fetchFaculties();
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('❌ Failed to delete faculty.');
    }
  };

  const institution = institutions.find(inst => inst.id === selectedInstitution);

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-chalkboard-teacher"></i>
          Manage Faculties
        </h2>
        <p>Create and manage academic faculties across institutions.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      <div className="lo-form-group">
        <label>Select Institution *</label>
        <select 
          value={selectedInstitution} 
          onChange={e => {
            setSelectedInstitution(e.target.value);
            setFormData({ name: '' });
            setEditingId(null);
          }}
          className="lo-form-control"
          required
        >
          <option value="">Choose Institution</option>
          {institutions.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
      </div>

      {selectedInstitution && (
        <>
          <div className="lo-card mt-4">
            <h3 className="lo-card-title">
              <i className={editingId ? "fas fa-edit" : "fas fa-plus"}></i>
              {editingId ? 'Edit Faculty' : 'Add Faculty to'} <strong>{institution?.name}</strong>
            </h3>

            <form onSubmit={handleSubmit} className="lo-form">
              <div className="lo-form-group">
                <label>Faculty Name *</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ name: e.target.value })}
                  required
                  placeholder="e.g., Faculty of Engineering"
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
                  {loading ? 'Saving...' : editingId ? 'Update Faculty' : 'Add Faculty'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="lo-btn lo-btn-secondary"
                    onClick={() => {
                      setFormData({ name: '' });
                      setEditingId(null);
                    }}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {faculties.length > 0 && (
            <div className="lo-section mt-4">
              <div className="lo-section-header">
                <h3>
                  <i className="fas fa-list"></i>
                  Faculties ({faculties.length})
                </h3>
              </div>
              <div className="lo-table-container">
                <table className="lo-table">
                  <thead>
                    <tr>
                      <th>Faculty</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculties.map(fac => (
                      <tr key={fac.id}>
                        <td><strong>{fac.name}</strong></td>
                        <td>
                          {fac.createdAt 
                            ? fac.createdAt.toLocaleDateString('en-GB', {
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
                              onClick={() => handleEdit(fac)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="lo-table-btn lo-btn-danger"
                              onClick={() => handleDelete(fac.id, fac.name)}
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
        </>
      )}
    </div>
  );
};

export default ManageFaculties;