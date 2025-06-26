import React, { useState } from 'react';
import axios from 'axios';

const TransferRequest = ({ stations, requestId, token }) => {
  const [selectedStation, setSelectedStation] = useState('');
  const [message, setMessage] = useState('');

  const transfer = async () => {
    try {
      await axios.post('/api/admin/assign', {
        requestId,
        stationId: selectedStation,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Transferred successfully.');
    } catch (err) {
      setMessage('❌ Transfer failed.');
    }
  };

  return (
    <div className="transfer-box">
      <select onChange={(e) => setSelectedStation(e.target.value)} value={selectedStation}>
        <option value="">Select Station</option>
        {stations.map(s => (
          <option key={s.id} value={s.id}>{s.username}</option>
        ))}
      </select>
      <button onClick={transfer}>Transfer</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default TransferRequest;
