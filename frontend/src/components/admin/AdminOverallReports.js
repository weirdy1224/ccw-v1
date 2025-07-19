import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Chart, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const QUARTERS = [
  { label: "Q1 (Jan-Mar)", start: "-01-01", end: "-03-31" },
  { label: "Q2 (Apr-Jun)", start: "-04-01", end: "-06-30" },
  { label: "Q3 (Jul-Sep)", start: "-07-01", end: "-09-30" },
  { label: "Q4 (Oct-Dec)", start: "-10-01", end: "-12-31" },
];

function getQuarterDates(year, q) {
  if (!q) q = 0;
  return {
    from: new Date(`${year}${QUARTERS[q].start}`),
    to: new Date(`${year}${QUARTERS[q].end}`),
  };
}

const statusColors = {
  Assigned: "#2585eb",
  Completed: "#41c97a",
  Rejected: "#f4625a",
  "Pending Assigned": "#dfa052",
  Pending: "#e9d73d",
  Total: "#a4a2e7"
};

export default function AdminOverallReports() {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [quarter, setQuarter] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const token = localStorage.getItem('token');

  // Fetch stations (police users)
  useEffect(() => {
    axios.get('/api/admin/stations', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStations(res.data));
  }, [token]);

  // Create a map of userId -> username
  const userIdToName = useMemo(() =>
    stations.reduce((map, user) => {
      map[user.id] = user.username;
      return map;
    }, {}), [stations]);

  // Fetch all requests
  useEffect(() => {
    setLoading(true);
    axios.get("/api/admin/requests", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (!requests.length) return null;
    const assigned = requests.filter(r => r.assigned_to).length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    const pendingAssigned = requests.filter(r => r.status === 'Pending' && r.assigned_to).length;
    const labels = ["Assigned", "Completed", "Rejected", "Pending Assigned"];
    const data = [assigned, completed, rejected, pendingAssigned];
    return {
      labels,
      datasets: [
        {
          label: "Requests",
          data,
          backgroundColor: labels.map(label => statusColors[label] || "#888"),
          borderWidth: 2,
        },
      ]
    };
  }, [requests]);

  // Filtered requests for bar chart, recents, aging (handles year, quarter, date range)
  const filtered = useMemo(() => {
    if (!from && !to && !quarter && !year) return requests;
    let f = from, t = to;
    if (quarter !== "") {
      const q = getQuarterDates(year, Number(quarter));
      f = q.from;
      t = q.to;
    }
    else if ((year || year === 0) && !quarter && !from && !to) {
      f = new Date(year, 0, 1);
      t = new Date(year, 11, 31, 23, 59, 59, 999);
    }
    return requests.filter(req => {
      const when = new Date(req.created_at);
      return (!f || when >= f) && (!t || when <= t);
    });
  }, [requests, from, to, quarter, year]);

  // Bar chart
  const barData = useMemo(() => {
    const completed = filtered.filter(r => r.status === 'Completed').length;
    const rejected = filtered.filter(r => r.status === 'Rejected').length;
    const pending = filtered.filter(r => r.status === 'Pending').length;
    const assigned = filtered.filter(r => r.assigned_to).length;
    return {
      labels: ["Completed", "Rejected", "Pending", "Assigned"],
      datasets: [
        {
          label: "Requests",
          data: [completed, rejected, pending, assigned],
          backgroundColor: [
            "#41c97a", "#f4625a", "#e9d73d", "#2585eb"
          ],
        },
      ]
    };
  }, [filtered]);

  // Recent requests
  const recentRequests = useMemo(() => {
    return [...requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  }, [requests]);

  // Requests pending > 7 days
  const agingRequests = useMemo(() => {
    const now = Date.now();
    return requests.filter(r =>
      r.status === "Pending" &&
      r.assigned_to &&
      new Date(r.created_at) < new Date(now - 7 * 24 * 60 * 60 * 1000)
    );
  }, [requests]);

  // Render
  return (
    <div className="admin-overall-reports" style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      <h2 className="reports-title">Admin Overall Reports</h2>

      {/* Pie Chart Overall */}
      <section className="reports-section reports-section--pie">
        <h3>Request Distribution (All Time)</h3>
        <div className="reports-pie-wrap">
          {loading ? <div>Loading...</div> : (
            pieData && pieData.datasets[0].data.reduce((a, b) => a + b, 0) > 0 ?
              <Pie
                data={pieData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } }
                }}
                width={330}
                height={240}
              /> : <div>No requests found.</div>
          )}
        </div>
      </section>

      {/* Timeframe Filter & Bar Chart */}
      <section className="reports-section reports-section--timeframe">
        <h3>Requests by Timeframe</h3>
        <div className="reports-filters-row">
          <label>
            Year:
            <select value={year} onChange={e => { setYear(Number(e.target.value)); setQuarter(""); setFrom(null); setTo(null); }} style={{ marginLeft: 5, marginRight: 16 }}>
              {[...Array(8)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option value={y} key={y}>{y}</option>
              })}
            </select>
          </label>
          <label>
            Quarter:
            <select value={quarter} onChange={e => { setQuarter(e.target.value); setFrom(null); setTo(null); }} style={{ marginLeft: 5 }}>
              <option value="">--</option>
              {QUARTERS.map((q, i) => <option value={i} key={i}>{q.label}</option>)}
            </select>
          </label>
          <span style={{ margin: "0 17px" }}>OR</span>
          <label>
            From: <DatePicker
              selected={from}
              onChange={date => { setFrom(date); setQuarter(""); }}
              maxDate={to}
              placeholderText="Start"
              dateFormat="yyyy-MM-dd"
              className="reports-datepicker"
            />
          </label>
          <label>
            To: <DatePicker
              selected={to}
              onChange={date => { setTo(date); setQuarter(""); }}
              minDate={from}
              maxDate={new Date()}
              placeholderText="End"
              dateFormat="yyyy-MM-dd"
              className="reports-datepicker"
            />
          </label>
          <button className="reports-filter-clear" onClick={() => { setFrom(null); setTo(null); setQuarter(""); }}>Clear</button>
        </div>
        {filtered.length ?
          <div className="reports-bar-wrap">
            <Bar
              data={barData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } }
                },
                maintainAspectRatio: false,
                scales: {
                  x: { beginAtZero: true }
                }
              }}
              width={330}
              height={180}
            />
          </div>
          : <div style={{ marginTop: 28 }}>No data for this period.</div>
        }
        <div className="reports-summary-numbers">
          <b>Total in timeframe:</b> {filtered.length}
          {" / "}
          <span>Completed: <b>{barData.datasets[0].data[0]}</b></span>
          {" / "}
          <span>Rejected: <b>{barData.datasets[0].data[1]}</b></span>
          {" / "}
          <span>Pending: <b>{barData.datasets[0].data[2]}</b></span>
        </div>
      </section>

      {/* Recent Table */}
      <section className="reports-section reports-section--recent">
        <h3>Recent 10 Requests</h3>
        <div className="reports-table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Name</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map(r => (
                <tr key={r.id}>
                  <td>{r.reference_number}</td>
                  <td>{r.name}</td>
                  <td>{r.status}</td>
                  <td>{userIdToName[r.assigned_to] || (r.assigned_to ? r.assigned_to : "No")}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Aging analysis */}
      <section className="reports-section reports-section--aging">
        <h3>Requests Pending &gt; 7 Days</h3>
        <div className="reports-aging-highlight">
          <span>{agingRequests.length}</span> requests pending more than 7 days.
        </div>
        {agingRequests.length ?
          <div className="reports-table-scroll" style={{ marginTop: 10 }}>
            <table className="reports-table reports-aging-table">
              <thead>
                <tr>
                  <th>Reference #</th>
                  <th>Name</th>
                  <th>Assigned To</th>
                  <th>Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {agingRequests.map(r => (
                  <tr key={r.id}>
                    <td>{r.reference_number}</td>
                    <td>{r.name}</td>
                    <td>{userIdToName[r.assigned_to] || r.assigned_to}</td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> : null}
      </section>
    </div>
  );
}
