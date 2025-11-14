// src/components/admin/ManageCompanies.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/LesothoOpportunities.css';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      setCompanies(
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null
        }))
      );
    } catch (err) {
      console.error('Error fetching companies:', err);
      setMessage('❌ Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'companies', id), { 
        status,
        updatedAt: new Date()
      });
      await fetchCompanies();
      setMessage(`✅ Company ${status.toLowerCase()}.`);
    } catch (error) {
      console.error('Update error:', error);
      setMessage('❌ Failed to update company status.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'companies', id));
      await fetchCompanies();
      setMessage('✅ Company deleted.');
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('❌ Failed to delete company.');
    }
  };

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-building"></i>
          Manage Companies
        </h2>
        <p>Approve, suspend, or delete company accounts.</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="lo-no-data">
          <div className="lo-spinner"></div>
          <p>Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="lo-no-data">
          <i className="fas fa-building"></i>
          <p>No companies registered yet.</p>
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <strong>{company.name || '—'}</strong>
                      {company.logoUrl && (
                        <img 
                          src={company.logoUrl} 
                          alt="Logo" 
                          className="ms-2"
                          style={{ 
                            height: '24px', 
                            width: '24px',
                            borderRadius: '4px',
                            objectFit: 'contain'
                          }} 
                        />
                      )}
                    </div>
                  </td>
                  <td>{company.email || '—'}</td>
                  <td>
                    <span className={`lo-status ${company.status?.toLowerCase() || 'pending'}`}>
                      {company.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {company.createdAt 
                      ? company.createdAt.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button 
                        className="lo-table-btn lo-btn-success" 
                        onClick={() => updateStatus(company.id, 'Approved')}
                        disabled={company.status === 'Approved'}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button 
                        className="lo-table-btn lo-btn-warning" 
                        onClick={() => updateStatus(company.id, 'Suspended')}
                        disabled={company.status === 'Suspended'}
                      >
                        <i className="fas fa-pause"></i> Suspend
                      </button>
                      <button 
                        className="lo-table-btn lo-btn-danger" 
                        onClick={() => handleDelete(company.id, company.name)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
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

export default ManageCompanies;