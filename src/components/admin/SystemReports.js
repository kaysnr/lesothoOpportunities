// src/components/admin/SystemReports.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SystemReports = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstitutions: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    newRegistrations: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const entityData = [
    { name: 'Students', value: stats.totalStudents },
    { name: 'Institutions', value: stats.totalInstitutions },
    { name: 'Companies', value: stats.totalCompanies }
  ].filter(item => item.value > 0);

  const activityData = [
    { name: 'Jobs', value: stats.totalJobs },
    { name: 'Applications', value: stats.totalApplications },
    { name: 'New Users (7d)', value: stats.newRegistrations }
  ].filter(item => item.value > 0);

  const COLORS = ['#5d47e6', '#2ecc71', '#ff6b6b', '#fbbf24', '#a78bfa'];

  useEffect(() => {
    fetchSystemReports();
  }, []);

  const fetchSystemReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        studentsSnapshot,
        institutionsSnapshot,
        companiesSnapshot,
        jobsSnapshot,
        applicationsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'institutions')),
        getDocs(collection(db, 'companies')),
        getDocs(collection(db, 'jobs')),
        getDocs(collection(db, 'courseApplications'))
      ]);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [recentStudents, recentInstitutions, recentCompanies] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('createdAt', '>=', sevenDaysAgo))),
        getDocs(query(collection(db, 'institutions'), where('createdAt', '>=', sevenDaysAgo))),
        getDocs(query(collection(db, 'companies'), where('createdAt', '>=', sevenDaysAgo)))
      ]);

      const newRegistrations = 
        recentStudents.size + recentInstitutions.size + recentCompanies.size;

      const recentJobs = await getDocs(
        query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), where('postedAt', '>=', sevenDaysAgo))
      );
      const recentApplications = await getDocs(
        query(collection(db, 'courseApplications'), orderBy('appliedAt', 'desc'), where('appliedAt', '>=', sevenDaysAgo))
      );

      const activity = [
        ...recentJobs.docs.map(doc => ({
          type: 'job',
          id: doc.id,
          title: `New Job: ${doc.data().title || 'Untitled'}`,
          name: `@ ${doc.data().companyName || 'Company'}`,
          timestamp: doc.data().postedAt?.toDate()
        })),
        ...recentApplications.docs.map(doc => ({
          type: 'application',
          id: doc.id,
          title: 'New Application',
          name: `Course: ${doc.data().courseName || 'N/A'}`,
          timestamp: doc.data().appliedAt?.toDate()
        })),
        ...recentStudents.docs.map(doc => ({
          type: 'registration',
          id: doc.id,
          title: 'Student Registration',
          name: doc.data().email || 'N/A',
          timestamp: doc.data().createdAt?.toDate()
        })),
        ...recentInstitutions.docs.map(doc => ({
          type: 'registration',
          id: doc.id,
          title: 'Institution Registration',
          name: doc.data().name || 'N/A',
          timestamp: doc.data().createdAt?.toDate()
        })),
        ...recentCompanies.docs.map(doc => ({
          type: 'registration',
          id: doc.id,
          title: 'Company Registration',
          name: doc.data().name || 'N/A',
          timestamp: doc.data().createdAt?.toDate()
        }))
      ]
        .filter(item => item.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      setStats({
        totalStudents: studentsSnapshot.size,
        totalInstitutions: institutionsSnapshot.size,
        totalCompanies: companiesSnapshot.size,
        totalJobs: jobsSnapshot.size,
        totalApplications: applicationsSnapshot.size,
        newRegistrations
      });
      setRecentActivity(activity);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('❌ Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'job': return '💼';
      case 'application': return '📄';
      case 'registration': return '👤';
      default: return 'ℹ️';
    }
  };

  const getMetricData = (key) => {
    const metrics = {
      totalStudents: { icon: '🎓', label: 'Students', color: '#5d47e6' },
      totalInstitutions: { icon: '🏫', label: 'Institutions', color: '#2ecc71' },
      totalCompanies: { icon: '🏢', label: 'Companies', color: '#ff6b6b' },
      totalJobs: { icon: '📣', label: 'Jobs Posted', color: '#fbbf24' },
      totalApplications: { icon: '📩', label: 'Applications', color: '#a78bfa' },
      newRegistrations: { icon: '📈', label: 'New (7d)', color: '#5d47e6' }
    };
    return metrics[key] || { icon: '📊', label: key, color: '#9ca3af' };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="lo-chart-tooltip">
          <p className="lo-label">{label}</p>
          <p className="lo-value">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="lo-institute-module">
        <div className="lo-module-header">
          <h2>
            <i className="fas fa-chart-pie"></i>
            System Reports & Analytics
          </h2>
        </div>
        <div className="lo-no-data">
          <div className="lo-spinner"></div>
          <p>Loading system analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-chart-pie"></i>
          System Reports & Analytics
        </h2>
        <p>Real-time overview of platform activity and user engagement</p>
      </div>

      {error && (
        <div className="lo-alert lo-alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {Object.entries(stats).map(([key, value]) => {
          const { icon, label, color } = getMetricData(key);
          return (
            <div key={key} className="col-sm-6 col-lg-4">
              <div className="lo-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="lo-stat-icon" style={{ backgroundColor: `${color}15`, color }}>
                  {icon}
                </div>
                <div className="lo-stat-content">
                  <div className="lo-stat-value">{value.toLocaleString()}</div>
                  <div className="lo-stat-label">{label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="lo-chart-card">
            <h3 className="lo-card-title">
              <i className="fas fa-users"></i>
              User Distribution
            </h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {entityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="lo-chart-card">
            <h3 className="lo-card-title">
              <i className="fas fa-tasks"></i>
              Platform Activity
            </h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    angle={-20} 
                    textAnchor="end"
                    height={80}
                    tick={{ fill: 'var(--lo-text-muted)', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--lo-text-muted)' }} 
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Count" 
                    radius={[6, 6, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-history"></i>
            Recent Activity (Last 7 Days)
          </h3>
        </div>
        {recentActivity.length === 0 ? (
          <div className="lo-no-data">
            <i className="fas fa-inbox"></i>
            <p>No recent activity found.</p>
          </div>
        ) : (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Details</th>
                  <th style={{ width: '180px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((act, idx) => {
                  const { icon } = getMetricData(
                    act.type === 'job' ? 'totalJobs' : 
                    act.type === 'application' ? 'totalApplications' : 'newRegistrations'
                  );
                  return (
                    <tr key={idx}>
                      <td>
                        <span className="me-2">{icon}</span>
                        {act.title}
                      </td>
                      <td>{act.name}</td>
                      <td>
                        {act.timestamp 
                          ? act.timestamp.toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="lo-publish-section mt-4">
        <h4>
          <i className="fas fa-file-export"></i>
          Export Reports
        </h4>
        <button className="lo-btn lo-btn-secondary" disabled>
          <i className="fas fa-download"></i>
          Export Full Report (CSV)
        </button>
        <p className="lo-hint mt-2">
          <i className="fas fa-info-circle"></i>
          Coming soon: Custom date ranges, PDF export, and automated reports.
        </p>
      </div>
    </div>
  );
};

export default SystemReports;