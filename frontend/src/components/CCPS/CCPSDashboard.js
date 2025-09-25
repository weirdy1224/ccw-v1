// src/pages/CCPSDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import AssignedRequests from './metrics/AssignedRequests';
import PendingCases from './metrics/PendingCases';

const CCPSDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get('/api/ccps/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(
        err.response?.data?.message || 'Failed to load data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="page-wrapper p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col gap-4">
        <h2 className="title text-2xl font-bold">CCPS Dashboard</h2>

        {loading && <p className="text-gray-500">Loading requests...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && requests.length === 0 && (
          <p className="text-gray-600">No requests assigned to you.</p>
        )}

        {/* Metrics Grid */}
        {!loading && requests.length > 0 && (
          <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssignedRequests requests={requests} />
            <PendingCases requests={requests} />
          </div>
        )}
      </div>
    </div>  
  );
};

export default CCPSDashboard;
