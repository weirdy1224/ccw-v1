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
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        TamilNadu Cyber Crime Wing
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Upload Unfreeze Request</Link>
        <Link to="/track" className="nav-link">Track Request</Link>

        {!role && (
          <>
            <Link to="/admin/login" className="nav-link">Admin</Link>
            <Link to="/controller/login" className="nav-link">Controller</Link>
            <Link to="/police/login" className="nav-link">Police</Link>
          </>
        )}

        {role === 'admin' && (
          <>
            <a
              href="/admin/dashboard#create-controller"
              className="nav-link"
              style={{
                background: 'linear-gradient(90deg, #00d4ff, #7b00ff)',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                marginRight: '1rem',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
              }}
            >
              + Controller
            </a>
            <a
              href="/admin/dashboard#create-police"
              className="nav-link"
              style={{
                background: 'linear-gradient(90deg, #00d4ff, #7b00ff)',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                marginRight: '1rem',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
              }}
            >
              + Police
            </a>
          </>
        )}

        {role === 'controller' && (
          <a
            href="/controller/dashboard#create-police"
            className="nav-link"
            style={{
              background: 'linear-gradient(90deg, #00d4ff, #7b00ff)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              marginRight: '1rem',
              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
            }}
          >
            + Police
          </a>
        )}

        {role && (
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{
              background: 'linear-gradient(90deg, #ff00ff, #7b00ff)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)',
            }}
          >
            Logout
          </button>
        )}

        <label className="theme-toggle-switch">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <span className="slider">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </label>
      </div>
    </nav>
  );
};

export default Navbar;
