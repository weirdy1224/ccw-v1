import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Dropdown toggle
  const handleReportsClick = (e) => {
    e.preventDefault();
    setShowReportsDropdown(prev => !prev);
  };

  // Optional: Close dropdown when clicking elsewhere
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest('.reports-dropdown')) {
        setShowReportsDropdown(false);
      }
    };
    document.addEventListener('mousedown', closeDropdown);
    return () => {
      document.removeEventListener('mousedown', closeDropdown);
    };
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        TamilNadu Cyber Crime Wing
      </Link>
      <div className="nav-links">

        {!role && (
          <>
            <Link to="/" className="nav-link">Upload Request</Link>
            <Link to="/track" className="nav-link">Track Request</Link>
            <Link to="/admin/login" className="nav-link">Admin</Link>
            <Link to="/controller/login" className="nav-link">Controller</Link>
            <Link to="/police/login" className="nav-link">Police</Link>
            {/* <Link to="/sp/login" className='nav-link'>SP Login</Link> */}
          </>
        )}

        {role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/search" className="nav-link">Search Request</Link>
            <Link to="/admin/create-controller" className="nav-link">Create Controller</Link>
            <Link to="/admin/create-police" className="nav-link">Create Police</Link>

            {/* Reports Dropdown */}
            <div className="nav-link reports-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={handleReportsClick}
                className="nav-link"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Reports ▼
              </button>
              {showReportsDropdown && (
                <div className="dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: 'white',
                  zIndex: 10,
                  minWidth: '180px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}>
                  <Link to="/admin/requests" className="dropdown-item nav-link" onClick={() => setShowReportsDropdown(false)}>User Requests</Link>
                  <Link to="/admin/police-assignments" className="dropdown-item nav-link" onClick={() => setShowReportsDropdown(false)}>Police Assignments</Link>
                  <Link to="/admin/overall-reports" className="dropdown-item nav-link" onClick={() => setShowReportsDropdown(false)}>Overall Reports</Link>
                </div>
              )}
            </div>
            {/* End Reports Dropdown */}

            {/* Remove direct User Requests/Police Assignments links here */}
            {/* <Link to="/admin/requests" className="nav-link">User Requests</Link> */}
            {/* <Link to="/admin/police-assignments" className="nav-link">Police Assignments</Link> */}
            {/* <Link to="/admin/documents" className="nav-link">View Documents</Link> */}
          </>
        )}

        {role === 'sp' && (
          <>
            <Link to="/SP/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/SP/search" className="nav-link">Search Request</Link>
            <Link to="/SP/create-controller" className="nav-link">Create Controller</Link>
            <Link to="/SP/create-police" className="nav-link">Create Police</Link>
            <Link to="/SP/police-assignments" className="nav-link">Police Assignments</Link>
            <Link to="/SP/requests" className="nav-link">User Requests</Link>
            {/* <Link to="/SP/documents" className="nav-link">View Documents</Link> */}
          </>
        )}

        {role === 'controller' && (
          <>
            <Link to="/controller/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/controller/search" className="nav-link">Search Request</Link>
            <Link to="/controller/create-police" className="nav-link">Create Police</Link>

            {/* Reports Dropdown */}
            <div className="nav-link reports-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={handleReportsClick}
                className="nav-link"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Reports ▼
              </button>
              {showReportsDropdown && (
                <div className="dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: 'white',
                  zIndex: 10,
                  minWidth: '180px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}>
                  <Link to="/controller/requests" className="dropdown-item nav-link" onClick={() => setShowReportsDropdown(false)}>User Requests</Link>
                  <Link to="/controller/police-assignments" className="dropdown-item nav-link" onClick={() => setShowReportsDropdown(false)}>Police Assignments</Link>
                  <Link to="/controller/overall-reports" className="dropdown-item nav-link" onClick={() => setShowReportsDropdown(false)}>Overall Reports</Link>
                </div>
              )}
            </div>
            {/* End Reports Dropdown */}

            {/* Remove direct User Requests/Police Assignments links here */}
            {/* <Link to="/controller/police-assignments" className="nav-link">Police Assignments</Link> */}
            {/* <Link to="/controller/requests" className="nav-link">View Requests</Link> */}
            {/* <Link to="/controller/documents" className="nav-link">View Documents</Link> */}
          </>
        )}

        {role === 'police' && (
          <>
            <Link to="/police/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/police/requests" className="nav-link">View Requests</Link>
            <Link to="/police/documents" className="nav-link">View Documents</Link>
          </>
        )}

        <button onClick={toggleTheme} className="nav-link" style={{ background: 'transparent', border: 'none' }}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        {role && (
          <button onClick={handleLogout} className="nav-link logout">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
