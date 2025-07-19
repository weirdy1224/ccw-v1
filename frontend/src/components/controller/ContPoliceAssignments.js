import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// MultiSelect is visually improved for integration below
function MultiSelect({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
      options.filter(
        o =>
          o.username.toLowerCase().includes(search.toLowerCase()) ||
          (o.station_name && o.station_name.toLowerCase().includes(search.toLowerCase()))
      ),
    [options, search]
  );
  const toggle = () => setOpen((a) => !a);
  const clear = () => { onChange([]); setSearch(''); };
  const handleSelect = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  return (
    <div className="pa-multiselect">
      <div className="pa-multiselect-label" tabIndex={0} onClick={toggle}>
        {selected.length ? `${selected.length} selected` : placeholder || "Select"}
        <span className="pa-multiselect-arrow">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="pa-multiselect-dropdown">
          <input
            placeholder="Search police..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pa-multiselect-search"
          />
          <div className="pa-multiselect-options">
            {filtered.map(option => (
              <label className={`pa-multiselect-option${selected.includes(option.id) ? ' pa-multiselect-option--selected' : ''}`} key={option.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => handleSelect(option.id)}
                  tabIndex={-1}
                />
                <span>
                  {option.username}
                  {option.station_name ? ` (${option.station_name})`:''}
                </span>
              </label>
            ))}
            {filtered.length === 0 && <div style={{ padding: 10, color: '#888' }}>No matches</div>}
          </div>
          <div className="pa-multiselect-actions">
            <button type="button" onClick={clear}>Clear</button>
            <button type="button" onClick={toggle}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const PoliceAssignments = () => {
  const [requests, setRequests] = useState([]);
  const [policeUsers, setPoliceUsers] = useState([]);
  const [selectedOfficers, setSelectedOfficers] = useState([]);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ by: null, asc: true });
  const [modalUser, setModalUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const [reqRes, stationsRes] = await Promise.all([
        axios.get('/api/controller/requests', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/controller/stations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRequests(reqRes.data); setPoliceUsers(stationsRes.data);
    } catch (err) {
      setError('Failed to load data.');
    }
  };

  const officerStats = useMemo(() =>
    policeUsers.map(user => {
      const assigned = requests.filter(r => r.assigned_to === user.id);
      const pending = assigned.filter(r => r.status === 'Pending');
      const completed = assigned.filter(r => r.status === 'Completed');
      return {
        ...user,
        assigned,
        totalAssigned: assigned.length,
        totalAssignedPending: pending.length,
        totalCompleted: completed.length
      };
    }), [requests, policeUsers]
  );
  const filteredOfficers = useMemo(
    () => (selectedOfficers.length
      ? officerStats.filter(u => selectedOfficers.includes(u.id))
      : officerStats),
    [officerStats, selectedOfficers]
  );
  const sortedOfficers = useMemo(() => {
    if (!sort.by) return filteredOfficers;
    const sorted = [...filteredOfficers].sort((a, b) =>
      sort.asc ? a[sort.by] - b[sort.by] : b[sort.by] - a[sort.by]
    );
    return sorted;
  }, [filteredOfficers, sort]);
  const openModal = (u) => setModalUser(u);
  const closeModal = () => setModalUser(null);

  return (
    <div className="pa-wrapper">
      <div className="pa-header-row">
        <h2>Police Assignments</h2>
        <MultiSelect
          options={policeUsers}
          selected={selectedOfficers}
          onChange={setSelectedOfficers}
          placeholder="Filter police users"
        />
      </div>
      {error && <p className="pa-error">{error}</p>}

      <div className="pa-table-scroll">
        <table className="pa-table">
  <thead>
    <tr>
      <th>Police User</th>
      <th
        onClick={() =>
          setSort(prev => ({
            by: "totalAssigned",
            asc: prev.by === "totalAssigned" ? !prev.asc : true
          }))
        }
        className="pa-sortable"
      >
        Total Assigned {sort.by === "totalAssigned" ? (sort.asc ? "▲" : "▼") : ""}
      </th>
      <th
        onClick={() =>
          setSort(prev => ({
            by: "totalAssignedPending",
            asc: prev.by === "totalAssignedPending" ? !prev.asc : true
          }))
        }
        className="pa-sortable"
      >
        Pending {sort.by === "totalAssignedPending" ? (sort.asc ? "▲" : "▼") : ""}
      </th>
      <th
        onClick={() =>
          setSort(prev => ({
            by: "totalCompleted",
            asc: prev.by === "totalCompleted" ? !prev.asc : true
          }))
        }
        className="pa-sortable"
      >
        Completed {sort.by === "totalCompleted" ? (sort.asc ? "▲" : "▼") : ""}
      </th>
    </tr>
  </thead>
  <tbody>
    {sortedOfficers.length ? sortedOfficers.map(user => (
      <tr key={user.id} className="pa-table-row" onClick={() => openModal(user)}>
        <td>{user.username}</td>
        <td>{user.totalAssigned}</td>
        <td>{user.totalAssignedPending}</td>
        <td>{user.totalCompleted}</td>
      </tr>
    )) : (
      <tr><td colSpan={4} className="pa-table-empty">No police users found.</td></tr>
    )}
  </tbody>
</table>

      </div>

      {modalUser && (
        <div className="pa-modal-overlay" onClick={closeModal}>
          <div className="pa-modal" onClick={e => e.stopPropagation()}>
            <h2>
              {modalUser.username} {modalUser.station_name ? <span className="pa-modal-station">({modalUser.station_name})</span> : ""}
            </h2>
            <div className="pa-modal-summary">
              <div>Assigned: <strong>{modalUser.totalAssigned}</strong></div>
              <div>Completed: <strong>{modalUser.totalCompleted}</strong></div>
              <div>Pending: <strong>{modalUser.totalAssignedPending}</strong></div>
            </div>
            <ul className="pa-modal-case-list">
              {modalUser.assigned.map(r => (
                <li key={r.id}>
                  <strong>{r.reference_number}</strong> – {r.status}
                  {r.status_reason ? <span className="pa-case-reason">({r.status_reason})</span> : ""}
                </li>
              ))}
              {!modalUser.assigned.length &&
                <li className="pa-case-empty">No cases assigned.</li>
              }
            </ul>
            <div style={{ textAlign: 'right' }}>
              <button type="button" className="pa-modal-close" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliceAssignments;
