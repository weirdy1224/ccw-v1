import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function AdminOverallReports() {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pie filter
  const [pieFilter, setPieFilter] = useState("all");

  // Bar filter
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // Table pagination
  const [page, setPage] = useState(1);
  const perPage = 25;

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("/api/admin/stations", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setStations(res.data));
  }, [token]);

  const userIdToName = useMemo(
    () =>
      stations.reduce((map, user) => {
        map[user.id] = user.username;
        return map;
      }, {}),
    [stations]
  );

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/admin/requests", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Filter helper for pie
  const filterByRange = (data, range) => {
    const now = new Date();
    let start;
    if (range === "year") start = new Date(now.getFullYear(), 0, 1);
    else if (range === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (range === "week") {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
    }
    return range === "all" ? data : data.filter((r) => new Date(r.created_at) >= start);
  };

  // Pie chart data
  const pieData = useMemo(() => {
    const filtered = filterByRange(requests, pieFilter);
    const completed = filtered.filter((r) => r.status === "Completed").length;
    const rejected = filtered.filter((r) => r.status === "Rejected").length;
    const pending = filtered.filter((r) => r.status === "Pending").length;

    return {
      labels: ["Completed", "Rejected", "Pending"],
      datasets: [
        {
          data: [completed, rejected, pending],
          backgroundColor: ["#41c97a", "#f4625a", "#e9d73d"],
        },
      ],
    };
  }, [requests, pieFilter]);

  // Bar chart filtered requests
  const barFilteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const createdAt = req.created_at ? new Date(req.created_at) : null;
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      return (
        (!fromDate || (createdAt && createdAt >= fromDate)) &&
        (!toDate || (createdAt && createdAt <= toDate))
      );
    });
  }, [requests, from, to]);

  // Bar chart data
  const barData = useMemo(() => {
    const completed = barFilteredRequests.filter((r) => r.status === "Completed").length;
    const rejected = barFilteredRequests.filter((r) => r.status === "Rejected").length;
    const pending = barFilteredRequests.filter((r) => r.status === "Pending").length;

    return {
      labels: ["Completed", "Rejected", "Pending"],
      datasets: [
        {
          label: "Requests",
          data: [completed, rejected, pending],
          backgroundColor: ["#41c97a", "#f4625a", "#e9d73d"],
        },
      ],
    };
  }, [barFilteredRequests]);

  // CCPS Pendency table
  const ccpsPendency = useMemo(() => {
    return requests
      .filter((r) => r.status === "Pending" && r.assigned_to)
      .map((r) => {
        const daysPending = Math.floor(
          (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        let color = "blue";
        if (daysPending > 5) color = "red";
        else if (daysPending >= 2) color = "yellow";
        return {
          ref: r.reference_number,
          pendingDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
          daysPending,
          color,
          assignedName: userIdToName[r.assigned_to] || r.assigned_to,
        };
      });
  }, [requests, userIdToName]);

  const paginatedCCPS = ccpsPendency.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="admin-overall-reports" style={{ maxWidth: 1300, margin: "0 auto", padding: 70, marginLeft: "350px" }}>
      <h2>Overall Performance Reports</h2>

      {/* Pie Chart */}
      <section>
        <h3>Request Distribution</h3>
        <div style={{ marginBottom: 10 }}>
          {["all", "year", "month", "week"].map((filter) => (
            <button
              key={filter}
              onClick={() => setPieFilter(filter)}
              style={{
                marginRight: 8,
                padding: "6px 12px",
                borderRadius: 6,
                background: pieFilter === filter ? "#2585eb" : "#ccc",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {filter === "all"
                ? "Overall"
                : filter === "year"
                ? "This Year"
                : filter === "month"
                ? "This Month"
                : "This Week"}
            </button>
          ))}
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <Pie data={pieData} options={{ plugins: { legend: { position: "bottom" } } }} />
          </div>
        )}
      </section>

      {/* Bar Chart */}
      <section style={{ marginTop: 40 }}>
        <h3>Requests by Timeframe</h3>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <label>
            From:
            <input
              type="date"
              value={from ? from.toISOString().split("T")[0] : ""}
              onChange={(e) => setFrom(e.target.value ? new Date(e.target.value) : null)}
              max={to ? to.toISOString().split("T")[0] : ""}
            />
          </label>
          <label>
            To:
            <input
              type="date"
              value={to ? to.toISOString().split("T")[0] : ""}
              onChange={(e) => setTo(e.target.value ? new Date(e.target.value) : null)}
              min={from ? from.toISOString().split("T")[0] : ""}
            />
          </label>
          <button onClick={() => { setFrom(null); setTo(null); }}>Clear</button>
        </div>
        <div style={{ maxWidth: 600 }}>
          <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
        </div>
      </section>

      {/* CCPS Table */}
      <section style={{ marginTop: 40 }}>
        <h3>CCPS Pendency Status</h3>
        <table className="reports-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Ref ID</th>
              <th>Pending Date</th>
              <th>Assigned CCPS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCCPS.map((r, idx) => (
              <tr key={idx}>
                <td>{r.ref}</td>
                <td style={{ backgroundColor: r.color, color: "#fff", fontWeight: "bold" }}>
                  {r.pendingDate}
                </td>
                <td>{r.assignedName}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>Page {page}</span>
          <button
            onClick={() => setPage((p) => (p * perPage < ccpsPendency.length ? p + 1 : p))}
            disabled={page * perPage >= ccpsPendency.length}
          >
            Next
          </button>
        </div>
      </section>

      {/* Aging Analysis */}
<section style={{ marginTop: 20 }}>
  <h3>Requests Pending &gt; 5 Days</h3>
  {(() => {
    const over5Days = ccpsPendency.filter((r) => r.daysPending > 5);
    return (
      <>
        <p>{over5Days.length} request{over5Days.length !== 1 ? "s" : ""} pending more than 5 days.</p>
        {over5Days.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>Ref ID</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>Assigned CCPS</th>
              </tr>
            </thead>
            <tbody>
              {over5Days.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "6px", borderBottom: "1px solid #eee" }}>{r.ref}</td>
                  <td style={{ padding: "6px", borderBottom: "1px solid #eee" }}>{r.assignedName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  })()}
</section>

    </div>
  );
}
