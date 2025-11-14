// src/components/student/CourseApplication.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const CourseApplication = ({ studentId }) => {
  const [courses, setCourses] = useState([]);
  const [appliedCourses, setAppliedCourses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setMessage('');
      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const studentData = studentDoc.data();
        const studentGPA = studentData?.gpa || 0;
        const applied = new Set(studentData?.appliedCourses || []);

        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const enrichedCourses = [];

        for (const courseDoc of coursesSnapshot.docs) {
          const course = { id: courseDoc.id, ...courseDoc.data() };
          if (!course.institutionId || course.isActive === false) continue;

          const instDoc = await getDoc(doc(db, 'institutions', course.institutionId));
          const institutionName = instDoc.exists() ? instDoc.data().name : '—';

          let facultyName = '—';
          if (course.facultyId) {
            const facultyDoc = await getDoc(doc(db, 'faculties', course.facultyId));
            if (facultyDoc.exists()) {
              facultyName = facultyDoc.data().name || '—';
            }
          }

          // ✅ Only show if eligible
          const eligible = !course.minGPA || studentGPA >= course.minGPA;
          if (eligible) {
            enrichedCourses.push({
              ...course,
              institutionName,
              facultyName,
              eligible
            });
          }
        }

        setCourses(enrichedCourses);
        setAppliedCourses(applied);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setMessage('❌ Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [studentId]);

  const handleApply = async (courseId) => {
    if (appliedCourses.has(courseId)) return;

    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) {
        setMessage('Course not found.');
        return;
      }
      const course = courseDoc.data();

      await addDoc(collection(db, 'courseApplications'), {
        studentId: studentId,
        courseId: courseId,
        institutionId: course.institutionId,
        appliedAt: new Date(),
        status: 'Pending'
      });

      await updateDoc(doc(db, 'students', studentId), {
        appliedCourses: arrayUnion(courseId)
      });

      setAppliedCourses(prev => new Set([...prev, courseId]));
      setMessage('✅ Application submitted successfully!');
    } catch (error) {
      console.error('Apply failed:', error);
      setMessage('❌ Failed to apply. Please try again.');
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-book-open"></i>
          Available Courses
        </h2>
        <p>Courses offered by registered institutions</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="lo-no-data">
          <div className="lo-spinner"></div>
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="lo-no-data">
          <i className="fas fa-search"></i>
          <p>No courses available or no courses match your profile.</p>
          <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
            Update your GPA in <strong>My Profile</strong> to see more opportunities.
          </p>
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Institution</th>
                <th>Faculty</th>
                <th>
                  <i className="fas fa-graduation-cap" title="Minimum GPA"></i> Min GPA
                </th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <strong>{course.name || '—'}</strong>
                    {!course.eligible && (
                      <span className="lo-badge lo-badge-warning" style={{ marginLeft: '8px' }}>
                        <i className="fas fa-exclamation-triangle"></i> Requires {course.minGPA}
                      </span>
                    )}
                  </td>
                  <td>{course.institutionName || '—'}</td>
                  <td>{course.facultyName || '—'}</td>
                  <td>
                    {course.minGPA && !isNaN(course.minGPA)
                      ? Number(course.minGPA).toFixed(2)
                      : '—'}
                  </td>
                  <td>
                    {appliedCourses.has(course.id) ? (
                      <span className="lo-status approved">Applied</span>
                    ) : (
                      <span className="lo-status pending">Eligible</span>
                    )}
                  </td>
                  <td>
                    {appliedCourses.has(course.id) ? (
                      <span className="lo-status approved">Applied</span>
                    ) : (
                      <button
                        className="lo-table-btn lo-btn-primary"
                        onClick={() => handleApply(course.id)}
                      >
                        <i className="fas fa-paper-plane"></i> Apply
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourseApplication;