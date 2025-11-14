// src/components/institute/ManageCourses.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    type: 'Full-time',
    facultyId: '',
    requirements: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFaculties();
    fetchCourses();
  }, []);

  const fetchFaculties = async () => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, 'faculties'), where('institutionId', '==', user.uid));
      const snapshot = await getDocs(q);
      setFaculties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  };

  const fetchCourses = async () => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, 'courses'), where('institutionId', '==', user.uid));
      const snapshot = await getDocs(q);
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, duration, facultyId } = formData;
    if (!name.trim() || !duration.trim() || !facultyId) {
      setMessage('Please fill all required fields.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const courseData = {
        ...formData,
        institutionId: user.uid,
        createdAt: editingId ? undefined : new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), courseData);
        setMessage('Course updated successfully!');
      } else {
        await addDoc(collection(db, 'courses'), courseData);
        setMessage('Course added successfully!');
      }

      setFormData({ name: '', duration: '', type: 'Full-time', facultyId: '', requirements: '' });
      setEditingId(null);
      await fetchCourses();
    } catch (err) {
      console.error(err);
      setMessage('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name || '',
      duration: course.duration || '',
      type: course.type || 'Full-time',
      facultyId: course.facultyId || '',
      requirements: course.requirements || ''
    });
    setEditingId(course.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'courses', id));
      setMessage('Course deleted.');
      await fetchCourses();
    } catch (err) {
      console.error(err);
      setMessage('Failed to delete course.');
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-book-open"></i>
          Manage Courses
        </h2>
        <p>Create and manage academic programs offered by your institution.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('successfully') || message.includes('deleted') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          <i className={`fas ${message.includes('successfully') || message.includes('deleted') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message}
        </div>
      )}

      <div className="lo-card">
        <h3 className="lo-card-title">
          <i className={editingId ? "fas fa-edit" : "fas fa-plus"}></i>
          {editingId ? 'Edit Course' : 'Add New Course'}
        </h3>

        <form onSubmit={handleSubmit} className="lo-form">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="lo-form-group">
                <label>Course Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., BSc Computer Science"
                  required
                  className="lo-form-control"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="lo-form-group">
                <label>Duration *</label>
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
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
                <select name="type" value={formData.type} onChange={handleChange} className="lo-form-control">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="lo-form-group">
                <label>Faculty *</label>
                <select 
                  name="facultyId" 
                  value={formData.facultyId} 
                  onChange={handleChange} 
                  required 
                  className="lo-form-control"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lo-form-group">
            <label>Entry Requirements</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="e.g., Mathematics and Physical Science at credit level"
              className="lo-form-control"
              rows="3"
            />
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
                  setFormData({ name: '', duration: '', type: 'Full-time', facultyId: '', requirements: '' });
                  setEditingId(null);
                }}
                disabled={loading}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Course List */}
      <div className="lo-section mt-4">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-list"></i>
            Existing Courses ({courses.length})
          </h3>
        </div>

        {courses.length === 0 ? (
          <div className="lo-no-data">
            <i className="fas fa-book-open"></i>
            <p>No courses added yet.</p>
            <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
              Start by adding your first course above.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {courses.map(course => {
              const faculty = faculties.find(f => f.id === course.facultyId);
              return (
                <div key={course.id} className="col-lg-6">
                  <div className="lo-card">
                    <h4 className="lo-course-name">{course.name}</h4>
                    <div className="lo-course-meta">
                      <span><strong>Faculty:</strong> {faculty?.name || 'N/A'}</span>
                      <span><strong>Duration:</strong> {course.duration}</span>
                      <span><strong>Type:</strong> {course.type}</span>
                    </div>
                    {course.requirements && (
                      <div className="lo-course-reqs">
                        <strong>Requirements:</strong> {course.requirements}
                      </div>
                    )}
                    <div className="lo-card-actions mt-3">
                      <button 
                        onClick={() => handleEdit(course)} 
                        className="lo-btn lo-btn-sm lo-btn-warning me-2"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id, course.name)} 
                        className="lo-btn lo-btn-sm lo-btn-danger"
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;