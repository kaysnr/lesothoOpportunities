// src/components/institute/InstituteSidebar.js
import React from 'react';

const InstituteSidebar = ({ activeView, setActiveView, onItemClick }) => {
  const menuItems = [
    { id: 'profile', label: 'Institution Profile', icon: 'fa-user-cog' },
    { id: 'faculties', label: 'Manage Faculties', icon: 'fa-chalkboard-teacher' },
    { id: 'courses', label: 'Manage Courses', icon: 'fa-book-open' },
    { id: 'applications', label: 'View Applications', icon: 'fa-file-alt' },
    { id: 'admissions', label: 'Publish Admissions', icon: 'fa-bullhorn' }
  ];

  const handleItemClick = (viewId) => {
    setActiveView(viewId);
    if (onItemClick) onItemClick();
  };

  return (
    <nav className="lo-sidebar">
      <div className="lo-sidebar-section">
        <h3 className="lo-sidebar-title">
          <i className="fas fa-university"></i> Institute Portal
        </h3>
        {menuItems.map((item) => (
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

export default InstituteSidebar;