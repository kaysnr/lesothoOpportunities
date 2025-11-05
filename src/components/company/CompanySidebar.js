// src/components/company/CompanySidebar.js
import React from 'react';

const CompanySidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'profile', label: 'Company Profile', icon: 'fa-user-cog' },
    { id: 'post-job', label: 'Post Job', icon: 'fa-bullhorn' },
    { id: 'applicants', label: 'View Applicants', icon: 'fa-users' }
  ];

  return (
    <aside className="lo-sidebar">
      <div className="lo-sidebar-section">
        <h3 className="lo-sidebar-title"><i className="fas fa-building"></i> Company Portal</h3>
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

export default CompanySidebar;