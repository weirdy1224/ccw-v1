import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PoliceAssignments = () => {
  const [requests, setRequests] = useState([]);
  const [policeUsers, setPoliceUsers] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [reqRes, stationsRes] = await Promise.all([
        axios.get('/api/admin/requests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/stations', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setRequests(reqRes.data);

      const policeOnly = stationsRes.data; 
      setPoliceUsers(policeOnly);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="page-wrapper">
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="police-flex">
        {policeUsers.map(user => {
          const assigned = requests.filter(r => r.assigned_to === user.id);
          return (
            <div className="police-card" key={user.id}>
              <h3>{user.username}</h3>
              <p>{assigned.length} case(s) assigned</p>
              <div className="assignment-details">
                <ul>
                  {assigned.map(r => (
                    <li key={r.id}>
                      {r.reference_number} – {r.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoliceAssignments;
