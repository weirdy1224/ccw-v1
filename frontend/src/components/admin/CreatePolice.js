// pages/CreatePolice.js
import React, { useState } from 'react';
import axios from 'axios';

const CreatePolice = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/controller/create-police', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Police user created successfully.');
      setForm({ username: '', password: '' });
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Error creating police user'));
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Create Police User</h2>
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
          <button type="submit">Create</button>
        </form>
        {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
};

export default CreatePolice;
