// src/components/institute/ManageCourses.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

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
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const courseData = {
        ...formData,
        institutionId: user.uid,
        createdAt: editingId ? undefined : new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), courseData);
      } else {
        await addDoc(collection(db, 'courses'), courseData);
      }

      setFormData({ name: '', duration: '', type: 'Full-time', facultyId: '', requirements: '' });
      setEditingId(null);
      await fetchCourses();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name,
      duration: course.duration,
      type: course.type || 'Full-time',
      facultyId: course.facultyId || '',
      requirements: course.requirements || ''
    });
    setEditingId(course.id);
  };

  return (
    <div className="lo-institute-module">
      <h2>Manage Courses</h2>
      <p>Create and manage academic programs offered by your institution.</p>

      <form onSubmit={handleSubmit} className="lo-form">
        <div className="lo-form-row">
          <div className="lo-form-group">
            <label>Course Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="lo-form-group">
            <label>Duration</label>
            <input
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 4 Years"
              required
            />
          </div>
        </div>

        <div className="lo-form-row">
          <div className="lo-form-group">
            <label>Type</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
          <div className="lo-form-group">
            <label>Faculty</label>
            <select name="facultyId" value={formData.facultyId} onChange={handleChange} required>
              <option value="">Select Faculty</option>
              {faculties.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lo-form-group">
          <label>Entry Requirements</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="e.g., Mathematics and Physical Science at credit level"
          />
        </div>

        <button type="submit" className="lo-btn lo-btn-primary" disabled={loading}>
          {editingId ? 'Update Course' : 'Add Course'}
        </button>
        {editingId && (
          <button
            type="button"
            className="lo-btn lo-btn-secondary"
            onClick={() => {
              setFormData({ name: '', duration: '', type: 'Full-time', facultyId: '', requirements: '' });
              setEditingId(null);
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="lo-courses-list">
        <h3>Existing Courses</h3>
        {courses.length === 0 ? (
          <p>No courses added yet.</p>
        ) : (
          <div className="lo-grid-container">
            {courses.map(course => (
              <div key={course.id} className="lo-grid-item">
                <div className="lo-grid-content">
                  <h4>{course.name}</h4>
                  <p><strong>Faculty:</strong> {faculties.find(f => f.id === course.facultyId)?.name || 'N/A'}</p>
                  <p><strong>Duration:</strong> {course.duration}</p>
                  <p><strong>Type:</strong> {course.type}</p>
                  <button onClick={() => handleEdit(course)} className="lo-btn lo-btn-sm lo-btn-warning">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;