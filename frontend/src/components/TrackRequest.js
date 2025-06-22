import React, { useState } from 'react';
import axios from 'axios';

const TrackRequest = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!referenceNumber.trim()) {
      setError('Please enter a valid reference number.');
      return;
    }

    try {
      const response = await axios.get(`/api/requests/track/${referenceNumber}`);
      if (response.data) {
        setResult(response.data);
      } else {
        setError('No request found with that ID.');
      }
    } catch (error) {
      console.error('Error tracking request:', error.response?.data || error.message);
      setError('Request not found or an error occurred.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Track Your Request</h2>
        <form onSubmit={handleTrack}>
          <div className="input-group">
            <label>Enter your Request ID to track status</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Request ID (e.g. REF1UQ0D8SUA)"
              required
            />
          </div>
          <button type="submit">Track</button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>Status: <span style={{ color: '#007bff' }}>{result.status}</span></h3>
            <p><strong>Full Name:</strong> {result.name}</p>
            <p><strong>Date Submitted:</strong> {new Date(result.created_at).toLocaleString()}</p>
            <p><strong>Account Number:</strong> {result.account_number}</p>
            <p><strong>Account Type:</strong> {result.account_type}</p>
            <p><strong>Reason for Unfreezing:</strong> {result.transaction_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackRequest;
