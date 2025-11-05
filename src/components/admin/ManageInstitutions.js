// src/components/admin/ManageInstitutions.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const ManageInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', location: '', contact: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    const querySnapshot = await getDocs(collection(db, 'institutions'));
    setInstitutions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'institutions', editingId), formData);
      } else {
        await addDoc(collection(db, 'institutions'), { ...formData, isActive: true, createdAt: new Date() });
      }
      setFormData({ name: '', email: '', location: '', contact: '' });
      setEditingId(null);
      await fetchInstitutions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (inst) => {
    setFormData({ name: inst.name, email: inst.email, location: inst.location, contact: inst.contact });
    setEditingId(inst.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this institution?')) {
      await deleteDoc(doc(db, 'institutions', id));
      await fetchInstitutions();
    }
  };

  return (
    <div className="lo-institute-module">
      <h2>Manage Institutions</h2>
      <form onSubmit={handleSubmit} className="lo-form">
        <div className="lo-form-group">
          <label>Institution Name</label>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="lo-form-row">
          <div className="lo-form-group">
            <label>Email</label>
            <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="lo-form-group">
            <label>Contact</label>
            <input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
          </div>
        </div>
        <div className="lo-form-group">
          <label>Location</label>
          <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
        </div>
        <button type="submit" className="lo-btn lo-btn-primary" disabled={loading}>
          {editingId ? 'Update Institution' : 'Add Institution'}
        </button>
      </form>

      <div className="lo-table-container">
        <table className="lo-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map(inst => (
              <tr key={inst.id}>
                <td>{inst.name}</td>
                <td>{inst.email}</td>
                <td>{inst.location}</td>
                <td>
                  <button className="lo-table-btn lo-btn-warning" onClick={() => handleEdit(inst)}>Edit</button>
                  <button className="lo-table-btn lo-btn-danger" onClick={() => handleDelete(inst.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageInstitutions;