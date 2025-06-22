import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ControllerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [createMessage, setCreateMessage] = useState('');
  const [policeForm, setPoliceForm] = useState({ username: '', password: '' });
  const [showCreatePolice, setShowCreatePolice] = useState(() => window.location.hash === '#create-police');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/controller/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);

      const stationRes = await axios.get('/api/controller/stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStations(stationRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    const handleHashChange = () => {
      setShowCreatePolice(window.location.hash === '#create-police');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const assignRequest = async (id, stationId) => {
    if (!stationId) {
      console.warn('Empty station ID. Skipping API call.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post('/api/controller/assign', { requestId: id, stationId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to assign request:', err.response?.data || err.message);
    }
  };

  const handleCreatePolice = async (e) => {
    e.preventDefault();
    setCreateMessage('');
    const token = localStorage.getItem('token');
    try {
      await axios.post('/api/controller/create-police', policeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreateMessage('✅ Police user created successfully.');
      setPoliceForm({ username: '', password: '' });
      fetchData();
    } catch (err) {
      setCreateMessage('❌ Failed to create police user: ' + (err.response?.data?.message || 'Error'));
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Controller Dashboard</h2>

        {showCreatePolice && (
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Create New Police User</h3>
            <form onSubmit={handleCreatePolice}>
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  value={policeForm.username}
                  onChange={(e) => setPoliceForm({ ...policeForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  value={policeForm.password}
                  onChange={(e) => setPoliceForm({ ...policeForm, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Create Police</button>
            </form>
            {createMessage && <p style={{ marginTop: '1rem' }}>{createMessage}</p>}
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reference</th>
              <th>Assign to Police</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{req.name}</td>
                <td>{req.reference_number}</td>
                <td>
                  <select
                    onChange={e => assignRequest(req.id, e.target.value)}
                    value={req.assigned_to || ''}
                  >
                    <option value="">Unassigned</option>
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>{st.username}</option>
                    ))}
                  </select>
                </td>
                <td>{req.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ControllerDashboard;
