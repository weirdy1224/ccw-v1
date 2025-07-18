import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    status: '',
    assignedTo: ''
  });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch requests and stations, initialize status list dynamically
  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, stationRes] = await Promise.all([
        axios.get('/api/admin/requests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/stations', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRequests(reqRes.data);

      // Dynamically compute unique statuses present in data
      const statusSet = new Set(reqRes.data.map(req => req.status).filter(Boolean));
      setStatuses(Array.from(statusSet));

      setStations(stationRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredRequests = requests.filter(req => {
    // Date filter
    const createdAt = req.created_at ? new Date(req.created_at) : null;
    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;
    // Assigned filter
    const assignedMatch = filters.assignedTo
      ? String(req.assigned_to) === String(filters.assignedTo)
      : true;
    // Status filter
    const statusMatch = filters.status ? req.status === filters.status : true;

    const dateMatch =
      (!fromDate || (createdAt && createdAt >= fromDate)) &&
      (!toDate || (createdAt && createdAt <= toDate));
    return dateMatch && statusMatch && assignedMatch;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(filt => ({ ...filt, [name]: value }));
  };

  const assignRequest = async (requestId, stationId) => {
    try {
      await axios.post(
        '/api/admin/assign',
        { requestId, stationId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchData();
    } catch (err) {
      console.error('Failed to assign request:', err.response?.data || err.message);
    }
  };

  const renderDocuments = (docPaths) => {
    if (!docPaths) return <p>No documents</p>;
    const docs = docPaths.split(',');

    return (
      <div className="docs-preview-container">
        {docs.map((doc, i) => {
          const backendUrl = 'http://localhost:5000';
          const cleaned = doc.trim().replace(/^\/?uploads\//i, '')
          const url = `${backendUrl}/${cleaned}`;
          const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
          return (
            <div className="doc-item" key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00c4cc', marginRight: '10px' }}
                onClick={e => e.stopPropagation()} // Prevent expands/row toggle when clicking a file
              >
                {isImage ? (
                  <img
                    src={url}
                    alt={`doc-${i}`}
                    className="doc-thumb"
                    style={{
                      width: '160px',
                      height: '160px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      boxShadow: '0 0 5px rgba(0,0,0,0.1)',
                      backgroundColor: '#fff'
                    }}
                  />
                ) : (
                  <div className="doc-filename">{`Document ${i + 1}`}</div>
                )}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Requests</h2>

        {/* --- Filters --- */}
        <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <label>From: </label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              max={filters.to}
            />
          </div>
          <div>
            <label>To: </label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              min={filters.from}
            />
          </div>
          <div>
            <label>Status: </label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              {statuses.map((status, i) => (
                <option key={i} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Assigned Police User: </label>
            <select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange}>
              <option value="">All</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>{st.username}</option>
              ))}
            </select>
          </div>
        </div>
        {/* --- End Filters --- */}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="main-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Name</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>View Request</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <React.Fragment key={req.id}>
                  <tr
                    onClick={() => setExpandedRow(expandedRow === req.id ? null : req.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{req.reference_number}</td>
                    <td>{req.name}</td>
                    <td>{req.status}</td>
                    <td>
                      <select
                        value={req.assigned_to || ''}
                        onClick={e => e.stopPropagation()} // Prevents row expand on select click
                        onChange={(e) => assignRequest(req.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.username}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setExpandedRow(expandedRow === req.id ? null : req.id);
                        }}
                        style={{ padding: '4px 10px', fontSize: '0.95em' }}
                      >
                        {expandedRow === req.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === req.id && (
                    <tr>
                      <td colSpan="5">
                        <div className="expanded-details">
                          <p><strong>Email:</strong> {req.email}</p>
                          <p><strong>Mobile:</strong> {req.mobile}</p>
                          <p><strong>Address:</strong> {req.address}</p>
                          <p><strong>Account Number:</strong> {req.account_number}</p>
                          <p><strong>Account Type:</strong> {req.account_type}</p>
                          <p><strong>Ownership:</strong> {req.account_ownership}</p>
                          <p><strong>NCRP Ack No.:</strong> {req.ncrp_ack_number}</p>
                          <p><strong>Business Description:</strong> {req.business_description}</p>
                          <p><strong>Transaction Reason:</strong> {req.transaction_reason}</p>
                          <p><strong>ID Proof Type:</strong> {req.id_proof_type}</p>
                          <h4>Uploaded Documents</h4>
                          {renderDocuments(req.document_paths)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    No requests found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
