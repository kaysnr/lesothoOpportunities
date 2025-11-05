// src/components/student/CourseApplications.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, addDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const CourseApplications = ({ studentId }) => {
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState({}); // courseId -> status
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoursesAndStatus = async () => {
      setLoading(true);
      try {
        // Get student's GPA
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const studentData = studentDoc.data();
        const studentGPA = studentData?.gpa || 0;

        // Fetch all active courses
        const coursesQuery = query(collection(db, 'courses'), where('isActive', '==', true));
        const courseSnapshot = await getDocs(coursesQuery);
        const courseList = courseSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(course => !course.minGPA || studentGPA >= course.minGPA);

        // Fetch student's course applications
        const appsQuery = query(collection(db, 'courseApplications'), where('studentId', '==', studentId));
        const appsSnapshot = await getDocs(appsQuery);
        const appStatus = {};
        appsSnapshot.forEach(doc => {
          const data = doc.data();
          appStatus[data.courseId] = data.status || 'Pending';
        });

        setCourses(courseList);
        setApplications(appStatus);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndStatus();
  }, [studentId]);

  const handleApply = async (courseId) => {
    if (applications[courseId]) return;

    try {
      // Create course application
      await addDoc(collection(db, 'courseApplications'), {
        studentId: studentId,
        courseId: courseId,
        appliedAt: new Date(),
        status: 'Pending'
      });

      // Optional: update student and course caches
      await updateDoc(doc(db, 'students', studentId), {
        appliedCourses: arrayUnion(courseId)
      });

      setApplications(prev => ({ ...prev, [courseId]: 'Pending' }));
    } catch (err) {
      console.error('Course application failed:', err);
      alert('Failed to apply. Please try again.');
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Available Courses</h2>
        <p>Courses matching your academic profile</p>
      </div>

      {loading ? (
        <div className="lo-no-data">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="lo-no-data">
          No courses match your current profile. Update your GPA in your profile to see more!
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Institution</th>
                <th>Faculty</th>
                <th>Min GPA</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{course.institutionName || '—'}</td>
                  <td>{course.faculty || '—'}</td>
                  <td>
                    {course.minGPA && !isNaN(course.minGPA)
                      ? Number(course.minGPA).toFixed(2)
                      : 'N/A'}
                  </td>
                  <td>
                    {applications[course.id] ? (
                      <span className={`lo-status ${applications[course.id].toLowerCase()}`}>
                        {applications[course.id]}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {applications[course.id] ? (
                      <span className="lo-status pending">Applied</span>
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

export default CourseApplications;