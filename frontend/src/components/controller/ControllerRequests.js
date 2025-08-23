import React, { useState, useEffect } from "react";
import axios from "axios";

const ControllerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]); // CCPS users
  const [controllers, setControllers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
    assignedTo: "",
  });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [completedYesterdayCount, setCompletedYesterdayCount] = useState(0);
  const [docUrls, setDocUrls] = useState({}); // Store fetched docs keyed by request id
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, stationRes, controllerRes] = await Promise.all([
        axios.get("/api/controller/requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/controller/stations", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/controller/controllers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRequests(reqRes.data);

      // Extract unique statuses for filter
      const statusSet = new Set(reqRes.data.map((r) => r.status).filter(Boolean));
      setStatuses(Array.from(statusSet));

      setStations(stationRes.data || []);
      setControllers(controllerRes.data || []);

      // Calculate completed yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      const completedYesterday = reqRes.data.filter((r) => {
        if (r.status !== "Completed") return false;
        const completedAt = r.completed_at ? new Date(r.completed_at) : null;
        if (!completedAt) return false;
        return completedAt >= yesterday && completedAt < today;
      }).length;

      setCompletedYesterdayCount(completedYesterday);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents when a request row is expanded, but only once per request
  const fetchRequestDocs = async (req) => {
    if (!req.id || docUrls[req.id]) return;
    try {
      const res = await axios.get(`/api/controller/documents/${req.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocUrls((old) => ({ ...old, [req.id]: res.data.urls || [] }));
    } catch (err) {
      console.warn("Failed to load documents for request", req.id, err);
      setDocUrls((old) => ({ ...old, [req.id]: [] }));
    }
  };

  const filteredRequests = requests.filter((req) => {
    const createdAt = req.created_at ? new Date(req.created_at) : null;
    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;
    const assignedMatch = filters.assignedTo ? String(req.assigned_to) === String(filters.assignedTo) : true;
    const assignedByMatch = filters.assignedBy ? String(req.assigned_by) === String(filters.assignedBy) : true;
    const statusMatch = filters.status ? req.status === filters.status : true;
    const dateMatch = (!fromDate || (createdAt && createdAt >= fromDate)) && (!toDate || (createdAt && createdAt <= toDate));
    return dateMatch && statusMatch && assignedMatch && assignedByMatch;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((filt) => ({ ...filt, [name]: value }));
  };

  // Assign request to a CCPS user
  const assignRequest = async (requestId, stationId) => {
    try {
      await axios.post("/api/controller/assign", { requestId, stationId: stationId || null }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error("Failed to assign request:", err.response?.data || err.message);
    }
  };

  const calculateTimeTaken = (req) => {
    if (req.status !== "Completed" && req.status !== "Rejected") return "-";
    let endTime = req.completed_at ? new Date(req.completed_at) : null;
    if (!endTime && req.status === "Rejected" && req.rejected_at) endTime = new Date(req.rejected_at);
    if (!endTime) return "-";
    const startTime = req.created_at ? new Date(req.created_at) : null;
    if (!startTime) return "-";
    const diffMs = endTime - startTime;
    if (diffMs < 0) return "-";
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  };

  const renderRemarksPanel = (req) => {
    return (
      <div
        className="remarks-panel"
        style={{
          minWidth: 260,
          maxWidth: 340,
          flex: 1,
          borderLeft: "1px solid #e3e4ef",
          paddingLeft: 32,
          borderRadius: 6,
          color: "#1a3c7e",
          fontWeight: 500,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <label><b>Remarks Sent to User:</b></label>
          <div
            style={{
              minHeight: 36,
              padding: "8px 12px",
              borderRadius: "4px",
              backgroundColor: "#eaf6ff",
              wordWrap: "break-word",
            }}
          >
            {req.status_reason || <span style={{ color: "#999" }}>(none)</span>}
          </div>
        </div>
        <div>
          <label><b>Detailed Report:</b></label>
          <div
            style={{
              minHeight: 48,
              padding: "9px 12px",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
              color: "#445",
              fontWeight: "normal",
              wordWrap: "break-word",
            }}
          >
            {req.detailed_report || <span style={{ color: "#999" }}>(none)</span>}
          </div>
        </div>
      </div>
    );
  };
 const renderDocuments = (req) => {
  const docs = docUrls[req.id] || [];
  if (!docs.length) return <p style={{color:'#7a8599', fontStyle:'italic'}}>No documents</p>;
  return (
    <div className="docs-preview-container" style={{
      display: "flex", flexWrap: "wrap", gap: "14px 24px", alignItems: "flex-start"
    }}>
      {docs.map(({ url, type }, i) => (
        <div key={i} className="doc-item" style={{
          display: "flex", alignItems: "center", background: "#f3f5fb",
          borderRadius: 7, padding: "10px 16px", minWidth: 160
        }}>
          <span style={{fontSize:'1.15em',marginRight:7, color:'#ee504f'}}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#ee504f" d="M5.5 2A2.5 2.5 0 0 0 3 4.5v9A2.5 2.5 0 0 0 5.5 16h7a2.5 2.5 0 0 0 2.5-2.5v-7L12 2H5.5zM12 4.5V9h4.5V7H14a2 2 0 0 1-2-2V4.5z" />
            </svg>
          </span>
          {type && <b style={{marginRight:4}}>{type.replace(/_/g, " ")}:</b>}
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{
              background: "#377efb", color: "#fff", textDecoration: "none", borderRadius: 6,
              padding: "4px 12px", marginLeft: 6, fontSize: "1em", fontWeight: 600,
              display: "inline-block", transition: "background 0.16s"
            }}
          >
            Document {i + 1}
          </a>
        </div>
      ))}
    </div>
  );
};
  return (
    <div className="page-wrapper">
      <div className="card">
        <h2 className="title">Requests</h2>
        <div
          className="summary-bar"
          style={{
            padding: "10px 16px",
            backgroundColor: "#e2ffd8",
            borderRadius: "6px",
            marginBottom: "16px",
            fontWeight: 600,
            color: "#27632a",
          }}
        >
          Completed Yesterday: {completedYesterdayCount}
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
          <div>
            <label>From: </label>
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} max={filters.to || ""} />
          </div>
          <div>
            <label>To: </label>
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} min={filters.from || ""} />
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
            <label>Assigned To (CCPS): </label>
            <select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange}>
              <option value="">All</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>{st.username}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="main-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ width: "8em" }}>Reference #</th>
                <th>Name</th>
                <th>Assigned To (CCPS)</th>
                <th>Status</th>
                <th>Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <React.Fragment key={req.id}>
                  <tr
                    onClick={() => {
                      const isOpening = expandedRow !== req.id;
                      setExpandedRow(isOpening ? req.id : null);
                      if (isOpening) fetchRequestDocs(req);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{req.reference_number}</td>
                    <td>{req.name}</td>
                    <td>
  <select
    value={req.assigned_to || ""}
    onClick={e => e.stopPropagation()} // So row doesn't "expand" on select click
    onChange={e => assignRequest(req.id, e.target.value)}
    style={{
      minWidth: 120,
      background: "#eaf7ff",
      border: "1px solid #aad",
      borderRadius: 6,
      padding: "3.5px 10px",
      fontSize: "1.03em"
    }}
  >
    <option value="">Unassigned</option>
    {stations.map((st) => (
      <option key={st.id} value={st.id}>
        {st.username}
      </option>
    ))}
  </select>
</td>

                    <td>{req.status}</td>
                    <td>{calculateTimeTaken(req)}</td>
                  </tr>
                  {expandedRow === req.id && (
                    <tr>
                      <td colSpan="7">
                        <div style={{
                          display: "flex",
                          gap: 36,
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          maxWidth: 1300,
                          margin: "18px 0"
                        }}>
                          {/* Personal / Case details */}
                          <div style={{ minWidth: 260, flex: 2 }}>
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
                            <div style={{ marginTop: 18 }}>
                              <h4>Uploaded Documents</h4>
                              {renderDocuments(req)}
                            </div>
                          </div>

                          {/* Remarks (read-only) */}
                          {renderRemarksPanel(req)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
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

export default ControllerRequests;
