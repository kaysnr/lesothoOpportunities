// src/components/student/AdmissionsView.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore'; // updateDoc not needed here
import '../../styles/LesothoOpportunities.css';

const AdmissionsView = ({ studentId }) => {
  const [institutionAdmissions, setInstitutionAdmissions] = useState([]);
  const [acceptedInstitution, setAcceptedInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAdmissions = async () => {
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
        setMessage('Failed to load admission results');
        setInstitutionAdmissions([]); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, [studentId]);

  // ... rest of component unchanged

  if (loading) {
    return <div className="lo-institute-module"><div className="lo-no-data">Loading...</div></div>;
  }

  return (
    <div className="lo-institute-module">
      <div className="lo-module-header">
        <h2>Admission Results</h2>
      </div>

      {message && <div className="lo-alert lo-alert-error">{message}</div>}

      {institutionAdmissions.length === 0 ? (
        <div className="lo-no-data">You have no admission offers yet.</div>
      ) : (
        <div className="lo-table-container">
          <table className="lo-table">
            <thead>
              <tr>
                <th>Institution / Course</th>
                <th>Program</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {institutionAdmissions.map((inst) => (
                <tr key={inst.id}>
                  <td>{inst.name || '—'}</td>
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
                        Select
                      </button>
                    ) : acceptedInstitution === inst.id ? (
                      <span className="lo-status approved">Selected</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {acceptedInstitution && (
        <div className="lo-alert lo-alert-success" style={{ marginTop: '16px' }}>
          ✓ You've selected an institution. You've been removed from other admission lists.
        </div>
      )}
    </div>
  );
};

// ✅ Add handleSelectInstitution if needed (you had it before)
const handleSelectInstitution = async (instId) => {
  // ... your existing logic
};

export default AdmissionsView;