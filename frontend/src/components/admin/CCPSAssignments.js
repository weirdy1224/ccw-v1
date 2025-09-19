import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

// --- MultiSelect with "Select All" (applies to currently filtered options) ---
function MultiSelect({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const filtered = useMemo(
    () =>
      options.filter(
        o =>
          o.username.toLowerCase().includes(search.toLowerCase()) ||
          (o.station_name && o.station_name.toLowerCase().includes(search.toLowerCase()))
      ),
    [options, search]
  );

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = () => setOpen(a => !a);
  const clear = () => { onChange([]); setSearch(''); };

  const handleSelect = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };

  // Select / Deselect all currently filtered options
  const handleSelectAllFiltered = () => {
    const filteredIds = filtered.map(o => o.id);
    if (filteredIds.length === 0) return;
    const allSelected = filteredIds.every(id => selected.includes(id));
    if (allSelected) {
      // remove the filtered ids from selection
      onChange(selected.filter(id => !filteredIds.includes(id)));
    } else {
      // add the filtered ids to selection (preserve existing)
      const newSelected = [...new Set([...selected, ...filteredIds])];
      onChange(newSelected);
    }
  };

  // Helper for checkbox state for "Select All (filtered)"
  const isAllFilteredSelected = filtered.length > 0 && filtered.every(o => selected.includes(o.id));

  return (
    <div className="pa-multiselect" ref={containerRef}>
      <div className="pa-multiselect-label" tabIndex={0} onClick={toggle}>
        {selected.length ? `${selected.length} selected` : placeholder || "Select"}
        <span className="pa-multiselect-arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="pa-multiselect-dropdown">
          <input
            placeholder="Search CCPS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pa-multiselect-search"
          />

          <div className="pa-multiselect-options">
            {/* Select All (applies only to filtered results) */}
            {options.length > 0 && (
              <label
                className={`pa-multiselect-option pa-multiselect-option--selectall${isAllFilteredSelected ? ' pa-multiselect-option--selected' : ''}`}
                key="__select_all__"
              >
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={handleSelectAllFiltered}
                  tabIndex={-1}
                />
                <span>Select All (visible)</span>
              </label>
            )}

            {/* Individual options */}
            {filtered.map(option => (
              <label
                className={`pa-multiselect-option${selected.includes(option.id) ? ' pa-multiselect-option--selected' : ''}`}
                key={option.id}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => handleSelect(option.id)}
                  tabIndex={-1}
                />
                <span>
                  {option.username}
                  {option.station_name ? ` (${option.station_name})` : ''}
                </span>
              </label>
            ))}

            {filtered.length === 0 && <div style={{ padding: 10, color: '#888' }}>No matches</div>}
          </div>

          <div className="pa-multiselect-actions">
            <button type="button" onClick={clear}>Clear</button>
            <button type="button" onClick={() => { setSearch(''); setOpen(false); }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CCPSAssignments component (full functionality restored) ---
const CCPSAssignments = () => {
  const [requests, setRequests] = useState([]);
  const [CCPSUsers, setCCPSUsers] = useState([]);
  const [selectedOfficers, setSelectedOfficers] = useState([]);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ by: null, asc: true });
  const [modalUser, setModalUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // adjust endpoints if your API path differs
        const [reqRes, stationsRes] = await Promise.all([
          axios.get('/api/admin/requests', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/stations', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setRequests(reqRes.data || []);
        setCCPSUsers(stationsRes.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
      }
    };
    fetchData();
  }, [token]);

  // compute per-officer stats (assigned, pending, completed, rejected)
  const officerStats = useMemo(() =>
    CCPSUsers.map(user => {
      const assigned = requests.filter(r => r.assigned_to === user.id);
      const pending = assigned.filter(r => r.status === 'Pending');
      const completed = assigned.filter(r => r.status === 'Completed');
      const rejected = assigned.filter(r => r.status === 'Rejected');
      return {
        ...user,
        assigned,
        totalAssigned: assigned.length,
        totalCompleted: completed.length,
        totalPending: pending.length,
        totalRejected: rejected.length
      };
    }),
    [requests, CCPSUsers]
  );

  // filter by selected officers (if any)
  const filteredOfficers = useMemo(
    () => (selectedOfficers.length
      ? officerStats.filter(u => selectedOfficers.includes(u.id))
      : officerStats),
    [officerStats, selectedOfficers]
  );

  // sorting
  const sortedOfficers = useMemo(() => {
    if (!sort.by) return filteredOfficers;
    const sorted = [...filteredOfficers].sort((a, b) => {
      // assume numeric fields for counts; fallback to string compare if needed
      const va = a[sort.by];
      const vb = b[sort.by];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sort.asc ? va - vb : vb - va;
      }
      // fallback to string compare
      return sort.asc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return sorted;
  }, [filteredOfficers, sort]);

  const openModal = (u) => setModalUser(u);
  const closeModal = () => setModalUser(null);

  return (
    <div className="pa-wrapper">
      <div className="pa-header-row">
        <h2>CCPS Wise Reports</h2>
        <MultiSelect
          options={CCPSUsers}
          selected={selectedOfficers}
          onChange={setSelectedOfficers}
          placeholder="Filter CCPS users"
        />
      </div>

      {error && <p className="pa-error">{error}</p>}

      <div className="pa-table-scroll">
        <table className="pa-table">
          <thead>
            <tr>
              <th>CCPS User</th>
              <th
                onClick={() =>
                  setSort(prev => ({
                    by: "totalAssigned",
                    asc: prev.by === "totalAssigned" ? !prev.asc : true
                  }))
                }
                className="pa-sortable"
              >
                Assigned {sort.by === "totalAssigned" ? (sort.asc ? "▲" : "▼") : ""}
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
              <th
                onClick={() =>
                  setSort(prev => ({
                    by: "totalPending",
                    asc: prev.by === "totalPending" ? !prev.asc : true
                  }))
                }
                className="pa-sortable"
              >
                Pending {sort.by === "totalPending" ? (sort.asc ? "▲" : "▼") : ""}
              </th>
              <th
                onClick={() =>
                  setSort(prev => ({
                    by: "totalRejected",
                    asc: prev.by === "totalRejected" ? !prev.asc : true
                  }))
                }
                className="pa-sortable"
              >
                Rejected {sort.by === "totalRejected" ? (sort.asc ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedOfficers.length ? sortedOfficers.map(user => (
              <tr key={user.id} className="pa-table-row" onClick={() => openModal(user)}>
                <td>{user.username}</td>
                <td>{user.totalAssigned}</td>
                <td>{user.totalCompleted}</td>
                <td>{user.totalPending}</td>
                <td>{user.totalRejected}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="pa-table-empty">No CCPS users found.</td>
              </tr>
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
              <div>Pending: <strong>{modalUser.totalPending}</strong></div>
              <div>Rejected: <strong>{modalUser.totalRejected}</strong></div>
            </div>

            <ul className="pa-modal-case-list">
              {modalUser.assigned && modalUser.assigned.length ? modalUser.assigned.map(r => (
                <li key={r.id}>
                  <strong>{r.reference_number}</strong> – {r.status}
                  {r.status_reason ? <span className="pa-case-reason">({r.status_reason})</span> : ""}
                </li>
              )) : (
                <li className="pa-case-empty">No cases assigned.</li>
              )}
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

export default CCPSAssignments;
