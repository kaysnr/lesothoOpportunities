// src/components/student/CourseApplication.js
import React, { useState, useEffect } from 'react';
// ✅ Removed 'query' and 'where' — not used
import { collection, getDocs, doc, getDoc, addDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const CourseApplication = ({ studentId }) => {
  const [courses, setCourses] = useState([]);
  const [appliedCourses, setAppliedCourses] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const studentData = studentDoc.data();
        const studentGPA = studentData?.gpa || 0;
        const applied = new Set(studentData?.appliedCourses || []);

        // Fetch all courses (no query/where needed since we filter in JS)
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const enrichedCourses = [];

        for (const courseDoc of coursesSnapshot.docs) {
          const course = { id: courseDoc.id, ...courseDoc.data() };
          if (!course.institutionId) continue;

          const instDoc = await getDoc(doc(db, 'institutions', course.institutionId));
          const institutionName = instDoc.exists() ? instDoc.data().name : '—';

          let facultyName = '—';
          if (course.facultyId) {
            const facultyDoc = await getDoc(doc(db, 'faculties', course.facultyId));
            if (facultyDoc.exists()) {
              facultyName = facultyDoc.data().name || '—';
            }
          }

          if (!course.minGPA || studentGPA >= course.minGPA) {
            enrichedCourses.push({
              ...course,
              institutionName,
              facultyName
            });
          }
        }

        setCourses(enrichedCourses);
        setAppliedCourses(applied);
      } catch (error) {
        console.error('Error fetching courses:', error);
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
        alert('Course not found.');
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
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Apply failed:', error);
      alert('Failed to apply to course. Please try again.');
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Available Courses</h2>
        <p>Courses offered by registered institutions</p>
      </div>

      {loading ? (
        <div className="lo-no-data">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="lo-no-data">
          No courses available or no courses match your profile.
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Institution</th>
                <th>Faculty</th>
                <th>Min GPA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.name || '—'}</td>
                  <td>{course.institutionName || '—'}</td>
                  <td>{course.facultyName || '—'}</td>
                  <td>
                    {course.minGPA && !isNaN(course.minGPA)
                      ? Number(course.minGPA).toFixed(2)
                      : 'N/A'}
                  </td>
                  <td>
                    {appliedCourses.has(course.id) ? (
                      <span className="lo-status approved">Applied</span>
                    ) : (
                      <button
                        className="lo-table-btn lo-btn-primary"
                        onClick={() => handleApply(course.id)}
                      >
                        Apply
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