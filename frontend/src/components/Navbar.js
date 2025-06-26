import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

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
          </>
        )}

        {role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/search" className="nav-link">Search Request</Link>
            <Link to="/admin/create-controller" className="nav-link">Create Controller</Link>
            <Link to="/admin/create-police" className="nav-link">Create Police</Link>
            <Link to="/admin/police-assignments" className="nav-link">Police Assignments</Link>
            <Link to="/admin/requests" className="nav-link">User Requests</Link>
            <Link to="/admin/documents" className="nav-link">View Documents</Link>
          </>
        )}

        {role === 'controller' && (
          <>
            <Link to="/controller/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/controller/search" className="nav-link">Search Request</Link>
            <Link to="/controller/post-transfer" className="nav-link">Post Transfer</Link>
            <Link to="/controller/create-police" className="nav-link">Create Police</Link>
            <Link to="/controller/police-assignments" className="nav-link">Police Assignments</Link>
            <Link to="/controller/requests" className="nav-link">My Requests</Link>
            <Link to="/controller/documents" className="nav-link">View Documents</Link>
          </>
        )}

        {role === 'police' && (
          <>
            <Link to="/police/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/police/requests" className="nav-link">My Requests</Link>
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
