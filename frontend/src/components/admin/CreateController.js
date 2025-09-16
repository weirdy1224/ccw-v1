// pages/CreateController.js
import React, { useState } from 'react';
import axios from 'axios';

const CreateController = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await axios.post(
        '/api/admin/create-controller',
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message || '✅ Controller created successfully.');
      setForm({ username: '', password: '' }); // reset form
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || '❌ Error creating controller';
      setMessage(errorMsg);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Create Controller</h2>
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
        {message && (
          <p style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateController;
