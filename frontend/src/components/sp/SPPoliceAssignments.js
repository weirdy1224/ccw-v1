import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SPPoliceAssignments = () => {
  const [requests, setRequests] = useState([]);
  const [policeUsers, setPoliceUsers] = useState([]);
  const [error, setError] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [reqRes, stationsRes] = await Promise.all([
        axios.get('/api/sp/requests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/sp/stations', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setRequests(reqRes.data);
      setPoliceUsers(stationsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => setSelectedOfficer(null);

  return (
    <div className="page-wrapper">
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="police-flex">
        {policeUsers.map(user => {
          const assigned = requests.filter(r => r.assigned_to === user.id);
          return (
            <div
              className="police-card"
              key={user.id}
              onClick={() => setSelectedOfficer({ ...user, assigned })}
            >
              <h3>{user.username}</h3>
              <p>{assigned.length} case(s) assigned</p>
            </div>
          );
        })}
      </div>

      {selectedOfficer && (
  <div className="officer-modal-overlay" onClick={closeModal}>
    <div className="officer-modal-large" onClick={(e) => e.stopPropagation()}>
      <h2>{selectedOfficer.username}</h2>
      <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
        <strong>{selectedOfficer.assigned.length}</strong> total assigned requests
      </p>

      <div className="status-summary">
        <span>Completed: <strong>{selectedOfficer.assigned.filter(r => r.status === 'Completed').length}</strong></span>
        <span>Pending: <strong>{selectedOfficer.assigned.filter(r => r.status === 'Pending').length}</strong></span>
        <span>Rejected: <strong>{selectedOfficer.assigned.filter(r => r.status === 'Rejected').length}</strong></span>
      </div>

      <ul className="case-list">
        {selectedOfficer.assigned.map(r => (
          <li key={r.id}>
            <strong>{r.reference_number}</strong> – {r.status}
          </li>
        ))}
      </ul>

      <button onClick={closeModal}>Close</button>
    </div>
  </div>
)}

    </div>
  );
};

export default SPPoliceAssignments;

