// src/components/student/AdmissionsView.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../../styles/LesothoOpportunities.css';

const AdmissionsView = ({ studentId }) => {
  const [institutionAdmissions, setInstitutionAdmissions] = useState([]);
  const [acceptedInstitution, setAcceptedInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAdmissions = async () => {
      setLoading(true);
      setMessage('');
      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          // ✅ Ensure it's an array
          const admitted = Array.isArray(data.admittedInstitutions)
            ? data.admittedInstitutions
            : [];
          setInstitutionAdmissions(admitted);
          setAcceptedInstitution(data.acceptedInstitution || null);
        }
      } catch (error) {
        setMessage('❌ Failed to load admission results.');
        setInstitutionAdmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, [studentId]);

  const handleSelectInstitution = async (instId) => {
    try {
      // Show confirmation
      if (!window.confirm('Are you sure you want to accept this admission? You will be removed from other admission lists.')) {
        return;
      }

      // Simulate selection (add your actual logic here)
      setAcceptedInstitution(instId);
      setMessage('✅ Admission confirmed! You\'ve been removed from other admission lists.');
      
      // In real app: update Firestore with selection
      // await updateDoc(doc(db, 'students', studentId), {
      //   acceptedInstitution: instId,
      //   updatedAt: new Date()
      // });
    } catch (error) {
      console.error('Selection error:', error);
      setMessage('❌ Failed to confirm admission.');
    }
  };

  if (loading) {
    return (
      <div className="lo-institute-module">
        <div className="lo-module-header">
          <h2>
            <i className="fas fa-check-circle"></i>
            Admission Results
          </h2>
        </div>
        <div className="lo-no-data">
          <div className="lo-spinner"></div>
          <p>Loading admission results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>
          <i className="fas fa-check-circle"></i>
          Admission Results
        </h2>
        <p>Review and confirm your admission offers</p>
      </div>

      {message && (
        <div className={`lo-alert ${message.includes('✅') ? 'lo-alert-success' : 'lo-alert-error'}`}>
          {message}
        </div>
      )}

      {institutionAdmissions.length === 0 ? (
        <div className="lo-no-data">
          <i className="fas fa-envelope-open"></i>
          <p>You have no admission offers yet.</p>
          <p style={{ fontSize: '0.95rem', marginTop: '8px', color: 'var(--lo-text-muted)' }}>
            Check back after applying to courses.
          </p>
        </div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Program</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {institutionAdmissions.map((inst) => (
                <tr key={inst.id}>
                  <td>
                    <strong>{inst.name || '—'}</strong>
                    {inst.logoUrl && (
                      <img 
                        src={inst.logoUrl} 
                        alt="Logo" 
                        style={{ 
                          height: '24px', 
                          width: '24px',
                          borderRadius: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle',
                          objectFit: 'contain'
                        }} 
                      />
                    )}
                  </td>
                  <td>{inst.program || '—'}</td>
                  <td>
                    <span className={`lo-status ${inst.status?.toLowerCase() || 'admitted'}`}>
                      {inst.status || 'Admitted'}
                    </span>
                  </td>
                  <td>
                    {inst.status === 'Admitted' && !acceptedInstitution ? (
                      <button
                        className="lo-table-btn lo-btn-primary"
                        onClick={() => handleSelectInstitution(inst.id)}
                      >
                        <i className="fas fa-check"></i> Select
                      </button>
                    ) : acceptedInstitution === inst.id ? (
                      <span className="lo-status approved">
                        <i className="fas fa-check"></i> Selected
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {acceptedInstitution && (
        <div className="lo-alert lo-alert-success" style={{ marginTop: '24px' }}>
          <i className="fas fa-check-circle"></i>
          <strong>Congratulations!</strong> You've confirmed your admission. You've been removed from other admission lists.
        </div>
      )}
    </div>
  );
};

export default AdmissionsView;