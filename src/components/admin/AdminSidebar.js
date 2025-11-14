// src/components/admin/AdminSidebar.js
import React from 'react';

const AdminSidebar = ({ activeView, setActiveView, onItemClick }) => {
  const menuItems = [
    { id: 'institutions', label: 'Manage Institutions', icon: 'fa-university' },
    { id: 'faculties', label: 'Manage Faculties', icon: 'fa-chalkboard-teacher' },
    { id: 'courses', label: 'Manage Courses', icon: 'fa-book-open' },
    { id: 'companies', label: 'Manage Companies', icon: 'fa-building' },
    { id: 'admissions', label: 'Publish Admissions', icon: 'fa-bullhorn' },
    { id: 'reports', label: 'System Reports', icon: 'fa-chart-bar' }
  ];

  const handleItemClick = (viewId) => {
    setActiveView(viewId);
    if (onItemClick) onItemClick();
  };

  return (
    <nav className="lo-sidebar">
      <div className="lo-sidebar-section">
        <h3 className="lo-sidebar-title">
          <i className="fas fa-user-tie"></i> Admin Portal
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

export default AdminSidebar;