import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDocuments = () => {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [documents, setDocuments] = useState([]);

  // Auth config for headers
  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  };

  // Fetch requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/requests', config);
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to load requests:', err.message);
    }
  };

  // Fetch documents for selected request
  const handleFetchDocuments = async () => {
    try {
      const res = await axios.get(`/api/admin/documents/${selectedId}`, config);
      setDocuments(res.data.urls || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">View Documents</h2>
        <div className="grid">
          <div className="input-group">
            <label>Select Request</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select</option>
              {requests.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.reference_number}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleFetchDocuments}>Fetch Documents</button>
        </div>

        <div className="grid" style={{ marginTop: '2rem' }}>
          {documents.length > 0 ? (
            documents.map((url, idx) => (
              <div key={idx}>
                <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
              </div>
            ))
          ) : (
            <p>No documents found or not yet selected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDocuments;
