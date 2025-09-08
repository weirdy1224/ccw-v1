import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/LOGO.png';


const reportLinks = [
  { label: "Status Reports", to: "/admin/requests" },
  { label: "CCPS Wise Reports", to: "/admin/CCPS-assignments" },
  { label: "Performance Reports", to: "/admin/overall-reports" },
];

const controllerReportLinks = [
  { label: "Status Reports", to: "/controller/requests" },
  { label: "CCPS Wise Reports", to: "/controller/CCPS-assignments" },
  { label: "Performance Reports", to: "/controller/overall-reports" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  // Instead of dropdown, show expandable for reports 
  // section
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // For auto-close "reports" on nav/route change
  useEffect(() => setReportsOpen(false), [location.pathname]);

  // Helper: check current path for active link highlighting
  const isActive = (to) => location.pathname === to;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <img 
          src= {logo}   // <-- put your logo image path here (e.g. public/logo.png)
          // alt="TamilNadu Cyber Crime Wing"
          style={{ height: '100px', width: 'auto', marginRight: '15px' }} // adjust size as needed
        />
      </Link>
      <div className="nav-links">
        {!role && (
          <>
            <Link to="/" className="nav-link">Upload Request</Link>
            <Link to="/track" className="nav-link">Track Request</Link>
            <Link to="/admin/login" className="nav-link">Admin</Link>
            <Link to="/controller/login" className="nav-link">Controller</Link>
            <Link to="/CCPS/login" className="nav-link">CCPS</Link>
          </>
        )}
        {role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="nav-link" tabIndex={0}>Dashboard</Link>
            <Link to="/admin/search" className="nav-link" tabIndex={0}>Search Request</Link>
            <Link to="/admin/create-controller" className="nav-link" tabIndex={0}>Create Controller</Link>
            <Link to="/admin/create-CCPS" className="nav-link" tabIndex={0}>Create CCPS</Link>

            {/* Reports section with expandable list, not dropdown */}
            <div className="reports-section-expandable">
              <button
                className={`reports-toggle${reportsOpen ? " open" : ""}`}
                aria-expanded={reportsOpen}
                onClick={() => setReportsOpen((o) => !o)}
                type="button"
              >Reports</button>
              <div className={reportsOpen ? "reports-links-expanded" : "reports-links-collapsed"}>
                {reportLinks.map(link => (
                  <Link
                    className={`nav-link${isActive(link.to) ? " active" : ""}`}
                    key={link.to}
                    to={link.to}
                  >{link.label}</Link>
                ))}
              </div>
            </div>
          </>
        )}

        {role === 'controller' && (
          <>
            <Link to="/controller/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/controller/search" className="nav-link">Search Request</Link>
            <Link to="/controller/create-CCPS" className="nav-link">Create CCPS</Link>
            {/* Reports section: controller version */}
            <div className="reports-section-expandable">
              <button
                className={`reports-toggle${reportsOpen ? " open" : ""}`}
                aria-expanded={reportsOpen}
                onClick={() => setReportsOpen((o) => !o)}
                type="button"
              >Reports</button>
              <div className={reportsOpen ? "reports-links-expanded" : "reports-links-collapsed"}>
                {controllerReportLinks.map(link => (
                  <Link
                    className={`nav-link${isActive(link.to) ? " active" : ""}`}
                    key={link.to}
                    to={link.to}
                  >{link.label}</Link>
                ))}
              </div>
            </div>
          </>
        )}

        {role === 'CCPS' && (
          <>
            <Link to="/CCPS/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/CCPS/requests" className="nav-link">View Requests</Link>
            <Link to="/CCPS/documents" className="nav-link">View Documents</Link>
          </>
        )}

        <button onClick={toggleTheme} className="theme-btn" type="button">
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {role && (
        <div className="logout-bar">
          <div className="logged-in-label">
            Logged in as: <b>{role.charAt(0).toUpperCase() + role.slice(1)}</b>
          </div>
          <button className="logout-btn" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
