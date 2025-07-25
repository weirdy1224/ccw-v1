import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PoliceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [modal, setModal] = useState({ visible: false, type: '', requestId: null });
  const [remark, setRemark] = useState('');
  const token = localStorage.getItem('token');

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/police/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error loading police requests:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const submitRemark = async () => {
    const { requestId, type } = modal;
    try {
      await axios.post('/api/police/status', {
        requestId,
        status: type,
        reason: remark
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setModal({ visible: false, type: '', requestId: null });
      setRemark('');
      fetchRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const renderDocuments = (docPaths) => {
  if (!docPaths) return <p>No documents</p>;
  const docs = docPaths.split(',');

  return (
    <div className="docs-preview-container">
      {docs.map((doc, i) => {
        const url = `${window.location.origin}/${doc}`;
        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
        return (
          <div className="doc-item" key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer">
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

const handleActionClick = (type, requestId) => {
  const req = requests.find(r => r.id === requestId);
  if (!req) return;

  // If already finalized
  if (['Completed', 'Rejected'].includes(req.status)) {
    const confirm = window.confirm(`This request is already marked as ${req.status}. Proceed to update status?`);
    if (!confirm) return;
  }

  setModal({ visible: true, type, requestId });
  setRemark('');
};

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Police Dashboard</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <React.Fragment key={req.id}>
                <tr
                  onClick={() => setExpandedRow(expandedRow === req.id ? null : req.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{req.name}</td>
                  <td>{req.reference_number}</td>
                  <td>{req.status}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick('Completed', req.id);
                      }}
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick('Rejected', req.id);
                      }}
                    >
                      Reject
                    </button>
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

      {/* Modal */}
      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{modal.type === 'Completed' ? 'Mark as Completed' : 'Reject Request'}</h3>
            <textarea
              rows="4"
              placeholder="Enter remarks..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            ></textarea>
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

export default PoliceRequests;
