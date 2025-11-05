// src/components/admin/AdminSidebar.js
import React from 'react';

const AdminSidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'institutions', label: 'Manage Institutions', icon: 'fa-university' },
    { id: 'faculties', label: 'Manage Faculties', icon: 'fa-chalkboard-teacher' },
    { id: 'courses', label: 'Manage Courses', icon: 'fa-book-open' },
    { id: 'companies', label: 'Manage Companies', icon: 'fa-building' },
    { id: 'admissions', label: 'Publish Admissions', icon: 'fa-bullhorn' },
    { id: 'reports', label: 'System Reports', icon: 'fa-chart-bar' }
  ];

  return (
    <aside className="lo-sidebar">
      <div className="lo-sidebar-section">
        <h3 className="lo-sidebar-title"><i className="fas fa-user-tie"></i> Admin Portal</h3>
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

export default AdminSidebar;