// src/components/institute/InstituteSidebar.js
import React from 'react';

const InstituteSidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'profile', label: 'Institution Profile', icon: 'fa-user-cog' },
    { id: 'faculties', label: 'Manage Faculties', icon: 'fa-chalkboard-teacher' },
    { id: 'courses', label: 'Manage Courses', icon: 'fa-book-open' },
    { id: 'applications', label: 'View Applications', icon: 'fa-file-alt' },
    { id: 'admissions', label: 'Publish Admissions', icon: 'fa-bullhorn' }
  ];

  return (
    <aside className="lo-sidebar">
      <div className="lo-sidebar-section">
        <h3 className="lo-sidebar-title"><i className="fas fa-university"></i> Institute Portal</h3>
        <ul className="lo-sidebar-menu">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`lo-sidebar-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <i className={`fas ${item.icon}`}></i>
              {item.label}
            </div>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default InstituteSidebar;