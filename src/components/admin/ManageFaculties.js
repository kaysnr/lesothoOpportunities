// src/components/admin/ManageFaculties.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const ManageFaculties = () => {
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [formData, setFormData] = useState({ name: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      fetchFaculties();
    }
  }, [selectedInstitution]);

  const fetchInstitutions = async () => {
    const querySnapshot = await getDocs(collection(db, 'institutions'));
    setInstitutions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchFaculties = async () => {
    const q = query(collection(db, 'faculties'), where('institutionId', '==', selectedInstitution));
    const querySnapshot = await getDocs(q);
    setFaculties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'faculties', editingId), formData);
      } else {
        await addDoc(collection(db, 'faculties'), {
          ...formData,
          institutionId: selectedInstitution,
          createdAt: new Date()
        });
      }
      setFormData({ name: '' });
      setEditingId(null);
      await fetchFaculties();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    setFormData({ name: faculty.name });
    setEditingId(faculty.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this faculty?')) {
      await deleteDoc(doc(db, 'faculties', id));
      await fetchFaculties();
    }
  };

  return (
    <div className="lo-institute-module">
      <h2>Manage Faculties</h2>
      
      <div className="lo-form-group" style={{ marginBottom: '20px' }}>
        <label>Select Institution</label>
        <select value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)}>
          <option value="">Choose Institution</option>
          {institutions.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
      </div>

      {selectedInstitution && (
        <>
          <form onSubmit={handleSubmit} className="lo-form">
            <div className="lo-form-group">
              <label>Faculty Name</label>
              <input
                value={formData.name}
                onChange={e => setFormData({ name: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="lo-btn lo-btn-primary">
              {editingId ? 'Update Faculty' : 'Add Faculty'}
            </button>
          </form>

          <div className="lo-table-container" style={{ marginTop: '30px' }}>
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map(fac => (
                  <tr key={fac.id}>
                    <td>{fac.name}</td>
                    <td>
                      <button className="lo-table-btn lo-btn-warning" onClick={() => handleEdit(fac)}>Edit</button>
                      <button className="lo-table-btn lo-btn-danger" onClick={() => handleDelete(fac.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageFaculties;