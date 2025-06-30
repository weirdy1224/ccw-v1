import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ControllerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      setStations(stationRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
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
          const url = `${window.location.origin}/${doc}`;
          const isImage = /\.(jpeg|jpg|png|webp|gif)$/i.test(url);

          return (
            <div className="doc-item" key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {isImage ? (
                  <img src={url} alt={`doc-${i}`} className="doc-thumb" />
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
        <h2 className="title">All Requests</h2>
        <table>
          <thead>
            <tr>
              <th>Reference #</th>
              <th>Name</th>
              <th>Status</th>
              <th>Assign To</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
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
                </tr>

                {expandedRow === req.id && (
                  <tr>
                    <td colSpan="4">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ControllerRequests;
