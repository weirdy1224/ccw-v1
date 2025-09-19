import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

import TotalRequests from './metrics/TotalRequests';
import AssignedRequests from './metrics/AssignedRequests';
import UnassignedRequests from './metrics/UnassignedRequests';
import PendingCases from './metrics/PendingCases';

ChartJS.register(ArcElement, Tooltip, Legend);

const ControllerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // all | year | month | week

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/controller/requests', {
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

  // --- 🔹 Filtering Logic ---
  const filterByTime = (data) => {
    if (timeFilter === 'all') return data;

    const now = new Date();
    return data.filter((r) => {
      if (!r.created_at) return false;
      const created = new Date(r.created_at);

      if (timeFilter === 'year') {
        return created.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'month') {
        return (
          created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth()
        );
      }
      if (timeFilter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return created >= startOfWeek && created < endOfWeek;
      }
      return true;
    });
  };

  const filteredRequests = filterByTime(requests);

  // --- 🔹 Counts for chart + metrics ---
  const completedCount = filteredRequests.filter(r => r.status === 'Completed').length;
  const rejectedCount = filteredRequests.filter(r => r.status === 'Rejected').length;
  const pendingCount = filteredRequests.filter(r => r.status === 'Pending').length;

  const chartData = {
    labels: ['Completed', 'Rejected', 'Pending'],
    datasets: [
      {
        data: [completedCount, rejectedCount, pendingCount],
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        hoverBackgroundColor: ['#218838', '#c82333', '#e0a800'],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#ccc' } }
    }
  };

  return (
    <div
      className="page-wrapper"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '100px',
        height: '100vh',
        marginLeft: '200px',
        paddingTop: '200px'
      }}
    >
      <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
        {/* Left: Chart + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 260, height: 260 }}>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {['year', 'month', 'week', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'black',
                  background: timeFilter === filter ? '#2585eb' : '#ccc',
                  transition: 'background 0.2s ease',
                }}
              >
                {filter === 'year' && 'This yr'}
                {filter === 'month' && 'This month'}
                {filter === 'week' && 'This week'}
                {filter === 'all' && 'All'}
              </button>
            ))}
          </div>

        </div>

        {/* Right: Metrics in 2x2 Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
            width: '450px'
          }}
        >
          <TotalRequests requests={filteredRequests} />
          <AssignedRequests requests={filteredRequests} />
          <UnassignedRequests requests={filteredRequests} />
          <PendingCases requests={filteredRequests} />
        </div>
      </div>
    </div>
  );
};

export default ControllerDashboard;
