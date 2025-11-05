// src/components/student/StudentSidebar.js
import React from 'react';

const StudentSidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-home' },
    { id: 'courses', label: 'Apply for Courses', icon: 'fas fa-book-open' },
    { id: 'admissions', label: 'Admission Results', icon: 'fas fa-check-circle' },
    { id: 'jobs', label: 'Job Opportunities', icon: 'fas fa-briefcase' },
    { id: 'profile', label: 'My Profile', icon: 'fas fa-user-cog' }
  ];

  return (
    <aside className="student-sidebar">
      <div className="sidebar-logo">
        <i className="fas fa-graduation-cap"></i>
        <span>Student Portal</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default StudentSidebar;