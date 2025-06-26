import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PoliceDashboard = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/police/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error loading police requests:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status, reason) => {
    const token = localStorage.getItem('token');
    await axios.post('/api/police/status', { requestId: id, status, reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchRequests();
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Police Dashboard</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{req.name}</td>
                <td>{req.reference_number}</td>
                <td>{req.status}</td>
                <td>
                  <button onClick={() => updateStatus(req.id, 'Completed', 'Account unfrozen')}>Mark Completed</button>
                  <button onClick={() => updateStatus(req.id, 'Rejected', 'Invalid documents')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoliceDashboard;