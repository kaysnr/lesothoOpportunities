// src/components/student/StudentSidebar.js
import React from 'react';

const StudentSidebar = ({ activeView, setActiveView, onItemClick }) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fa-home' },
    { id: 'courses', label: 'Apply for Courses', icon: 'fa-book-open' },
    { id: 'admissions', label: 'Admission Results', icon: 'fa-check-circle' },
    { id: 'jobs', label: 'Job Opportunities', icon: 'fa-briefcase' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user-cog' }
  ];

  const handleItemClick = (viewId) => {
    setActiveView(viewId);
    if (onItemClick) onItemClick();
  };

  return (
    <nav className="lo-sidebar">
      <div className="lo-sidebar-section">
        <h3 className="lo-sidebar-title">
          <i className="fas fa-graduation-cap"></i> Student Portal
        </h3>
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`lo-sidebar-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleItemClick(item.id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleItemClick(item.id)}
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default StudentSidebar;