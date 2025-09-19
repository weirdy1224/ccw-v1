  // pages/CreateCCPS.js
  import React, { useState } from 'react';
  import axios from 'axios';

  const CreateCCPS = () => {
    const [form, setForm] = useState({ username: '', password: '', zone: 'SP 1' });
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage('');
      try {
        await axios.post('/api/controller/create-CCPS', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage('✅ CCPS user created successfully.');
        setForm({ username: '', password: '', zone: 'SP 1' });
      } catch (err) {
        setMessage('❌ ' + (err.response?.data?.message || 'Error creating CCPS user'));
      }
    };

    return (
      <div className="page-wrapper">
        <div className="card">
          <h2 className="title">Create CCPS User</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Zone</label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              >
                <option value="SP 1">SP 1</option>
                <option value="NZ">North Zone</option>
                <option value="WZ">West Zone</option>
                <option value="CZ">Central Zone</option>
                <option value="SZ">South Zone</option>
              </select>
            </div>
            <button type="submit">Create</button>
          </form>
          {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
        </div>
      </div>
    );
  };

  export default CreateCCPS;
