import React, { useEffect, useState } from 'react';
import axios from 'axios';

import AssignedRequests from './metrics/AssignedRequests';
import UnassignedRequests from './metrics/UnassignedRequests';
import PendingCases from './metrics/PendingCases';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/police/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="page-wrapper">
      <div className='flex'>
      <h2 className="title">Police Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <AssignedRequests requests={requests} />
        <UnassignedRequests requests={requests} />
        <PendingCases requests={requests} />
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
