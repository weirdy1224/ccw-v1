// admin/Requests.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('/api/admin/requests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token]);

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">All Requests</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Name</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.reference_number}</td>
                  <td>{req.name}</td>
                  <td>{req.status}</td>
                  <td>{req.assigned_username || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
