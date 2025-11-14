// src/components/admin/ManageCourses.js
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

const ManageCourses = () => {
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    type: 'Full-time',
    minGPA: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      setFaculties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const q = query(collection(db, 'courses'), where('institutionId', '==', selectedInstitution));
      const querySnapshot = await getDocs(q);
      setCourses(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null
      })));
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const courseData = {
        ...formData,
        minGPA: formData.minGPA ? parseFloat(formData.minGPA) : null,
        institutionId: selectedInstitution,
        name: formData.name.trim(),
        createdAt: editingId ? undefined : new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), courseData);
        setMessage('✅ Course updated successfully!');
      } else {
        await addDoc(collection(db, 'courses'), courseData);
        setMessage('✅ Course added successfully!');
      }

      setFormData({ name: '', duration: '', type: 'Full-time', minGPA: '', isActive: true });
      setEditingId(null);
      await fetchCourses();
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ Failed to save course.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name || '',
      duration: course.duration || '',
      type: course.type || 'Full-time',
      minGPA: course.minGPA?.toString() || '',
      isActive: course.isActive !== false
    });
    setEditingId(course.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'courses', id));
      setMessage('✅ Course deleted.');
      await fetchCourses();
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('❌ Failed to delete course.');
    }
  };

  const institution = institutions.find(inst => inst.id === selectedInstitution);

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-book-open"></i>
          Manage Courses
        </h2>
        <p>Create and manage academic programs across institutions.</p>
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
            setFormData({ name: '', duration: '', type: 'Full-time', minGPA: '', isActive: true });
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
              {editingId ? 'Edit Course' : 'Add Course to'} <strong>{institution?.name}</strong>
            </h3>

            <form onSubmit={handleSubmit} className="lo-form">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="lo-form-group">
                    <label>Course Name *</label>
                    <input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., BSc Computer Science"
                      className="lo-form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="lo-form-group">
                    <label>Duration *</label>
                    <input
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 4 Years"
                      required
                      className="lo-form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="lo-form-group">
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="lo-form-control"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="lo-form-group">
                    <label>Min GPA (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minGPA}
                      onChange={e => setFormData({ ...formData, minGPA: e.target.value })}
                      min="0"
                      max="4"
                      placeholder="e.g., 2.5"
                      className="lo-form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="lo-form-actions">
                <button 
                  type="submit" 
                  className="lo-btn lo-btn-primary" 
                  disabled={loading}
                >
                  <i className="fas fa-save"></i>
                  {loading ? 'Saving...' : editingId ? 'Update Course' : 'Add Course'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="lo-btn lo-btn-secondary"
                    onClick={() => {
                      setFormData({ name: '', duration: '', type: 'Full-time', minGPA: '', isActive: true });
                      setEditingId(null);
                    }}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {courses.length > 0 && (
            <div className="lo-section mt-4">
              <div className="lo-section-header">
                <h3>
                  <i className="fas fa-list"></i>
                  Courses ({courses.length})
                </h3>
              </div>
              <div className="lo-table-container">
                <table className="lo-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Min GPA</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td><strong>{course.name}</strong></td>
                        <td>{course.duration}</td>
                        <td>{course.type}</td>
                        <td>{course.minGPA ? course.minGPA.toFixed(2) : '—'}</td>
                        <td>
                          {course.createdAt 
                            ? course.createdAt.toLocaleDateString('en-GB', {
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
                              onClick={() => handleEdit(course)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="lo-table-btn lo-btn-danger"
                              onClick={() => handleDelete(course.id, course.name)}
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

export default ManageCourses;