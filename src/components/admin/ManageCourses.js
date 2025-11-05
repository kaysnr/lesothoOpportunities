// src/components/admin/ManageCourses.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const ManageCourses = () => {
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [formData, setFormData] = useState({
    program: '',
    duration: '',
    type: 'Full-time',
    minGPA: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      fetchFaculties();
      fetchCourses();
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

  const fetchCourses = async () => {
    const q = query(collection(db, 'courses'), where('institutionId', '==', selectedInstitution));
    const querySnapshot = await getDocs(q);
    setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const courseData = {
        ...formData,
        minGPA: formData.minGPA ? parseFloat(formData.minGPA) : null,
        institutionId: selectedInstitution,
        createdAt: editingId ? undefined : new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), courseData);
      } else {
        await addDoc(collection(db, 'courses'), courseData);
      }

      setFormData({ program: '', duration: '', type: 'Full-time', minGPA: '', isActive: true });
      setEditingId(null);
      await fetchCourses();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      program: course.program || '',
      duration: course.duration || '',
      type: course.type || 'Full-time',
      minGPA: course.minGPA?.toString() || '',
      isActive: course.isActive !== false
    });
    setEditingId(course.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course?')) {
      await deleteDoc(doc(db, 'courses', id));
      await fetchCourses();
    }
  };

  return (
    <div className="lo-institute-module">
      <h2>Manage Courses</h2>
      
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
            <div className="lo-form-row">
              <div className="lo-form-group">
                <label>Program Name</label>
                <input
                  value={formData.program}
                  onChange={e => setFormData({ ...formData, program: e.target.value })}
                  required
                />
              </div>
              <div className="lo-form-group">
                <label>Duration</label>
                <input
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 4 Years"
                  required
                />
              </div>
            </div>

            <div className="lo-form-row">
              <div className="lo-form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div className="lo-form-group">
                <label>Min GPA (Optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.minGPA}
                  onChange={e => setFormData({ ...formData, minGPA: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="lo-btn lo-btn-primary">
              {editingId ? 'Update Course' : 'Add Course'}
            </button>
          </form>

          <div className="lo-table-container" style={{ marginTop: '30px' }}>
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Min GPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.program}</td>
                    <td>{course.duration}</td>
                    <td>{course.type}</td>
                    <td>{course.minGPA || 'N/A'}</td>
                    <td>
                      <button className="lo-table-btn lo-btn-warning" onClick={() => handleEdit(course)}>Edit</button>
                      <button className="lo-table-btn lo-btn-danger" onClick={() => handleDelete(course.id)}>Delete</button>
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

export default ManageCourses;