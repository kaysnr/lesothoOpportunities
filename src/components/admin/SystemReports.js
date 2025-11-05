// src/components/admin/SystemReports.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

// ✅ Recharts imports
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

  // ✅ Chart data
  const entityData = [
    { name: 'Students', value: stats.totalStudents },
    { name: 'Institutions', value: stats.totalInstitutions },
    { name: 'Companies', value: stats.totalCompanies }
  ];

  const activityData = [
    { name: 'Jobs', value: stats.totalJobs },
    { name: 'Applications', value: stats.totalApplications },
    { name: 'New Users (7d)', value: stats.newRegistrations }
  ];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    fetchSystemReports();
  }, []);

  const fetchSystemReports = async () => {
    setLoading(true);
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
        getDocs(collection(db, 'applications')) // or 'courseApplications' if needed
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

      // Recent activity
      const recentJobsSnapshot = await getDocs(
        query(collection(db, 'jobs'), orderBy('postedAt', 'desc'), where('postedAt', '>=', sevenDaysAgo))
      );
      const recentApplicationsSnapshot = await getDocs(
        query(collection(db, 'applications'), orderBy('appliedAt', 'desc'), where('appliedAt', '>=', sevenDaysAgo))
      );

      const activity = [
        ...recentJobsSnapshot.docs.map(doc => ({
          type: 'job',
          id: doc.id,
          title: doc.data().title || 'New Job Posted',
          name: doc.data().companyName || 'Company',
          timestamp: doc.data().postedAt?.toDate()
        })),
        ...recentApplicationsSnapshot.docs.map(doc => ({
          type: 'application',
          id: doc.id,
          title: 'New Application',
          name: 'Student',
          timestamp: doc.data().appliedAt?.toDate()
        })),
        ...recentStudents.docs.map(doc => ({
          type: 'registration',
          id: doc.id,
          title: 'Student Registered',
          name: doc.data().email,
          timestamp: doc.data().createdAt?.toDate()
        })),
        ...recentInstitutions.docs.map(doc => ({
          type: 'registration',
          id: doc.id,
          title: 'Institution Registered',
          name: doc.data().name,
          timestamp: doc.data().createdAt?.toDate()
        })),
        ...recentCompanies.docs.map(doc => ({
          type: 'registration',
          id: doc.id,
          title: 'Company Registered',
          name: doc.data().name,
          timestamp: doc.data().createdAt?.toDate()
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

      setStats({
        totalStudents: studentsSnapshot.size,
        totalInstitutions: institutionsSnapshot.size,
        totalCompanies: companiesSnapshot.size,
        totalJobs: jobsSnapshot.size,
        totalApplications: applicationsSnapshot.size,
        newRegistrations
      });

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'job': return 'fas fa-briefcase';
      case 'application': return 'fas fa-file-contract';
      case 'registration': return 'fas fa-user-plus';
      default: return 'fas fa-info-circle';
    }
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'totalStudents': return 'fas fa-graduation-cap';
      case 'totalInstitutions': return 'fas fa-school';
      case 'totalCompanies': return 'fas fa-building';
      case 'totalJobs': return 'fas fa-bullhorn';
      case 'totalApplications': return 'fas fa-envelope-open-text';
      case 'newRegistrations': return 'fas fa-chart-line';
      default: return 'fas fa-chart-bar';
    }
  };

  const getMetricColor = (metric) => {
    switch (metric) {
      case 'totalStudents': return '#4F46E5'; // indigo-600
      case 'totalInstitutions': return '#10B981'; // emerald-500
      case 'totalCompanies': return '#F59E0B'; // amber-500
      case 'totalJobs': return '#EF4444'; // red-500
      case 'totalApplications': return '#8B5CF6'; // violet-500
      case 'newRegistrations': return '#0EA5E9'; // sky-500
      default: return '#6B7280'; // gray-500
    }
  };

  if (loading) {
    return (
      <div className="lo-institute-module">
        <div className="lo-no-data">Loading system analytics...</div>
      </div>
    );
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-chart-pie" style={{ marginRight: '12px', color: '#4F46E5' }}></i>
          System Reports & Analytics
        </h2>
        <p>Real-time overview of platform activity and user engagement</p>
      </div>

      {/* Stats Cards */}
      <div className="lo-stats-grid">
        {Object.entries(stats).map(([key, value]) => (
          <div className="lo-stat-card" key={key}>
            <div className="lo-stat-icon">
              <i 
                className={getMetricIcon(key)} 
                style={{ color: getMetricColor(key) }}
              ></i>
            </div>
            <div className="lo-stat-content">
              <h3>{value.toLocaleString()}</h3>
              <p>
                {key === 'totalStudents' && 'Students'}
                {key === 'totalInstitutions' && 'Institutions'}
                {key === 'totalCompanies' && 'Companies'}
                {key === 'totalJobs' && 'Jobs Posted'}
                {key === 'totalApplications' && 'Applications'}
                {key === 'newRegistrations' && 'New (7d)'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="lo-charts-section">
        <div className="lo-chart-card">
          <h3 className="lo-card-title">
            <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={entityData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {entityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lo-chart-card">
          <h3 className="lo-card-title">
            <i className="fas fa-tasks" style={{ marginRight: '8px' }}></i>
            Platform Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="value" name="Count">
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lo-section">
        <div className="lo-section-header">
          <h3>
            <i className="fas fa-bell" style={{ marginRight: '8px' }}></i>
            Recent Activity
          </h3>
        </div>
        {recentActivity.length === 0 ? (
          <div className="lo-no-data">No recent activity found.</div>
        ) : (
          <div className="lo-table-container">
            <table className="lo-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td>
                      <i 
                        className={getActivityIcon(activity.type)} 
                        style={{ 
                          color: getMetricColor(activity.type === 'job' ? 'totalJobs' : 
                                   activity.type === 'application' ? 'totalApplications' : 'newRegistrations'),
                          marginRight: '12px',
                          fontSize: '18px'
                        }}
                      ></i>
                      {activity.title}
                    </td>
                    <td>{activity.name}</td>
                    <td>
                      {activity.timestamp ? 
                        activity.timestamp.toLocaleString() : 
                        'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="lo-export-section">
        <button className="lo-btn lo-btn-primary" disabled>
          <i className="fas fa-file-export" style={{ marginRight: '8px' }}></i>
          Export Full Report (CSV)
        </button>
        <p className="lo-export-note">
          <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
          Full analytics export and custom date ranges coming soon.
        </p>
      </div>
    </div>
  );
};

export default SystemReports;