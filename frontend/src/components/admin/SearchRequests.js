import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchRequests = () => {
  const [query, setQuery] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('/api/admin/requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const filtered = query
    ? requests.filter(
        req =>
          req.name?.toLowerCase().includes(query.toLowerCase()) ||
          req.reference_number?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Search Requests</h2>
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by name or reference number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading ? (
          <p style={{ marginTop: '1rem' }}>Loading requests...</p>
        ) : (
          <ul className="results-list">
            {query && filtered.length ? (
              filtered.map(req => (
                <li key={req.id} className="result-item">
                  <span className="ref-num">{req.reference_number}</span>
                  <span className="name">{req.name}</span>
                </li>
              ))
            ) : (
              <li className="result-item empty">
                {query ? 'No matching results.' : 'Please enter a search term.'}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchRequests;