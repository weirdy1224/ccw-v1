import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [error, setError] = useState('');
  const [showCreateController, setShowCreateController] = useState(() => window.location.hash === '#create-controller');
  const [controllerForm, setControllerForm] = useState({ username: '', password: '' });
  const [controllerMessage, setControllerMessage] = useState('');
  const [policeForm, setPoliceForm] = useState({ username: '', password: '' });
  const [createMessage, setCreateMessage] = useState('');
  const [showCreatePolice, setShowCreatePolice] = useState(() => window.location.hash === '#create-police');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/admin/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);

      const stationsRes = await axios.get('/api/admin/stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStations(stationsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();

    const handleHashChange = () => {
      setShowCreateController(window.location.hash === '#create-controller');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  useEffect(() => {
      fetchData();
  
      const handleHashChange = () => {
        setShowCreatePolice(window.location.hash === '#create-police');
      };
  
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
  const assignStation = async (id, stationId) => {
    try {
      await axios.post('/api/admin/assign', {
        requestId: id,
        stationId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Assignment failed:', err);
    }
  };

  const handleCreateController = async (e) => {
    e.preventDefault();
    setControllerMessage('');
    try {
      await axios.post('/api/admin/create-controller', controllerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setControllerMessage('✅ Controller created successfully.');
      setControllerForm({ username: '', password: '' });
    } catch (err) {
      setControllerMessage('❌ Failed to create controller: ' + (err.response?.data?.message || 'Error'));
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
        <h2 className="title">Admin Dashboard</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {showCreateController && (
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Create New Controller</h3>
            <form onSubmit={handleCreateController}>
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  value={controllerForm.username}
                  onChange={(e) => setControllerForm({ ...controllerForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  value={controllerForm.password}
                  onChange={(e) => setControllerForm({ ...controllerForm, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Create Controller</button>
            </form>
            {controllerMessage && <p style={{ marginTop: '1rem' }}>{controllerMessage}</p>}
          </div>
        )}
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

        {/* Request Assignment Table */}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reference</th>
              <th>Assign Station</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map(req => (
                <tr key={req.id}>
                  <td>{req.name}</td>
                  <td>{req.reference_number}</td>
                  <td>
                    <select onChange={(e) => assignStation(req.id, e.target.value)} value={req.assigned_to || ''}>
                      <option value="">Unassigned</option>
                      {stations.map(st => (
                        <option key={st.id} value={st.id}>{st.username}</option>
                      ))}
                    </select>
                  </td>
                  <td>{req.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No requests found or loading failed.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
