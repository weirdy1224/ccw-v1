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
          headers: { Authorization: `Bearer ${token} `}
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
  ? requests.filter(req => {
      const q = query.toLowerCase();
      return (
        req.name?.toLowerCase().includes(q) ||
        req.reference_number?.toLowerCase().includes(q) ||
        req.mobile?.toLowerCase().includes(q) 
      );
    })
  : [];


  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Search Requests</h2>

        <div className="search-bar-wrapper">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by Name or Reference # or Mobile Number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="search-results">
            {query && filtered.length ? (
              filtered.map(req => (
                <div key={req.id} className="search-box">
                  <p><strong>Reference #:</strong> {req.reference_number}</p>
                  <p><strong>Name:</strong> {req.name}</p>
                  <p><strong>Mobile:</strong> {req.mobile}</p>
                  <p><strong>Email:</strong> {req.email}</p>
                  <p><strong>Address:</strong> {req.address}</p>
                  <p><strong>Account Number:</strong> {req.account_number}</p>
                  <p><strong>Account Type:</strong> {req.account_type}</p>
                  <p><strong>Ownership:</strong> {req.account_ownership}</p>
                  <p><strong>NCRP Ack #:</strong> {req.ncrp_ack_number}</p>
                  <p><strong>Business Description:</strong> {req.business_description}</p>
                  <p><strong>Transaction Reason:</strong> {req.transaction_reason}</p>
                  <p><strong>ID Proof Type:</strong> {req.id_proof_type}</p>
                  <p><strong>Status:</strong> {req.status}</p>
                  {req.document_paths && (
                    <p><strong>Documents:</strong>{' '}
                      {req.document_paths.split(',').map((file, i) => (
                        <a
                          key={i}
                          href={`/uploads/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#00c4cc', marginRight: '10px' }}
                        >
                          File {i + 1}
                        </a>
                      ))}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p>{query ? 'No results found.' : 'Please enter a search term.'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchRequests;