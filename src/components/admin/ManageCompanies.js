// src/components/admin/ManageCompanies.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    setCompanies(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'companies', id), { status });
    await fetchCompanies();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently delete this company?')) {
      await deleteDoc(doc(db, 'companies', id));
      await fetchCompanies();
    }
  };

  return (
    <div className="lo-institute-module">
      <h2>Manage Companies</h2>
      <p>Approve, suspend, or delete company accounts.</p>
      
      <div className="lo-table-container">
        <table className="lo-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.email}</td>
                <td>
                  <span className={`lo-status ${company.status?.toLowerCase() || 'pending'}`}>
                    {company.status || 'Pending'}
                  </span>
                </td>
                <td>
                  <button 
                    className="lo-table-btn lo-btn-success" 
                    onClick={() => updateStatus(company.id, 'Approved')}
                    disabled={company.status === 'Approved'}
                  >
                    Approve
                  </button>
                  <button 
                    className="lo-table-btn lo-btn-warning" 
                    onClick={() => updateStatus(company.id, 'Suspended')}
                    disabled={company.status === 'Suspended'}
                  >
                    Suspend
                  </button>
                  <button 
                    className="lo-table-btn lo-btn-danger" 
                    onClick={() => handleDelete(company.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCompanies;