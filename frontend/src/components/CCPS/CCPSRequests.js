import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MAX_USER_REMARKS = 20;   // words
const MAX_DETAILED_REPORT = 50; // words

const CCPSRequests = () => {
  const [requests, setRequests] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [modal, setModal] = useState({ visible: false, type: '', requestId: null });
  const [remarkUser, setRemarkUser] = useState('');
  const [remarkReport, setRemarkReport] = useState('');
  const [docUrls, setDocUrls] = useState({});
  const token = localStorage.getItem('token');

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/ccps/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error loading CCPS requests:', err);
    }
  };

  const fetchRequestDocs = async (req) => {
    if (!req.id || docUrls[req.id]) return;
    try {
      const res = await axios.get(`/api/ccps/documents/${req.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocUrls((old) => ({ ...old, [req.id]: res.data.urls || [] }));
    } catch {
      setDocUrls((old) => ({ ...old, [req.id]: [] }));
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const submitRemark = async () => {
    const { requestId, type } = modal;

    // word limits
    const userWords = remarkUser.trim().split(/\s+/).filter(Boolean).length;
    const reportWords = remarkReport.trim().split(/\s+/).filter(Boolean).length;

    if (userWords > MAX_USER_REMARKS) {
      alert(`Remark to User cannot exceed ${MAX_USER_REMARKS} words.`);
      return;
    }
    if (reportWords > MAX_DETAILED_REPORT) {
      alert(`Detailed Report cannot exceed ${MAX_DETAILED_REPORT} words.`);
      return;
    }

    try {
      await axios.post(
        '/api/ccps/status',
        {
          requestId,
          status: type,
          status_reason: remarkUser,
          detailed_report: remarkReport,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setModal({ visible: false, type: '', requestId: null });
      setRemarkUser('');
      setRemarkReport('');
      fetchRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDecision = async (requestId, decision) => {
    try {
      if (decision === "Declined") {
        const confirmDecline = window.confirm(
          "Are you sure you want to decline this request? This action cannot be undone."
        );
        if (!confirmDecline) return;
      }
      await axios.post(
        "/api/ccps/decision",
        { requestId, status: decision },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (err) {
      console.error(`Failed to update decision for #${requestId}:`, err);
    }
  };

  const renderDocuments = (req) => {
    const docs = docUrls[req.id] || [];
    if (!docs.length) return <p>No documents</p>;

    return (
      <div className="docs-preview-container" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {docs.map(({ url, type }, i) => (
          <div key={i} className="doc-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <b>{type ? type.replace(/_/g, ' ') : 'Document'}:</b>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{
                background: '#377efb', color: '#fff', textDecoration: 'none', borderRadius: 6,
                padding: '4px 12px', fontWeight: 600
              }}
            >
              Open {i + 1}
            </a>
          </div>
        ))}
      </div>
    );
  };

  const handleActionClick = (type, requestId) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    if (['Completed', 'Rejected'].includes(req.status)) {
      const confirm = window.confirm(`This request is already marked as ${req.status}. Proceed to update status?`);
      if (!confirm) return;
    }

    setModal({ visible: true, type, requestId });
    setRemarkUser('');
    setRemarkReport('');
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">CCPS Dashboard</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <React.Fragment key={req.id}>
                <tr
                  onClick={() => {
                    setExpandedRow(expandedRow === req.id ? null : req.id);
                    if (expandedRow !== req.id) fetchRequestDocs(req);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{req.name}</td>
                  <td>{req.reference_number}</td>
                  <td>{req.status}</td>
                  <td>
                    {/* --- Decision Stage --- */}
                    {req.status === "Pending" && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecision(req.id, "Accepted"); }}
                          style={{ background: "#28a745", color: "#fff", marginRight: 8, border: "none", padding: "5px 10px", borderRadius: 4 }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecision(req.id, "Declined"); }}
                          style={{ background: "#dc3545", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 4 }}
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {/* --- After Accepted --- */}
                    {req.status === "Accepted" && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleActionClick('Completed', req.id); }}>
                          Mark Completed
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleActionClick('Rejected', req.id); }}>
                          Reject
                        </button>
                      </>
                    )}

                    {/* --- Declined Locked --- */}
                    {req.status === "Declined" && (
                      <span style={{ color: "#dc3545", fontWeight: 600 }}>Declined</span>
                    )}
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
                        {renderDocuments(req)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{modal.type === 'Completed' ? 'Mark as Completed' : 'Reject Request'}</h3>

            <label>Remark to User (max 20 words)</label>
            <textarea
              rows="3"
              placeholder="Enter remark to user..."
              value={remarkUser}
              onChange={(e) => setRemarkUser(e.target.value)}
            ></textarea>
            <small>{remarkUser.trim().split(/\s+/).filter(Boolean).length}/{MAX_USER_REMARKS} words</small>

            <label>Detailed Report (max 50 words)</label>
            <textarea
              rows="5"
              placeholder="Enter detailed report..."
              value={remarkReport}
              onChange={(e) => setRemarkReport(e.target.value)}
            ></textarea>
            <small>{remarkReport.trim().split(/\s+/).filter(Boolean).length}/{MAX_DETAILED_REPORT} words</small>

            <div className="modal-actions">
              <button onClick={submitRemark}>
                {modal.type === 'Completed' ? 'Confirm Completion' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setModal({ visible: false, type: '', requestId: null })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCPSRequests;
