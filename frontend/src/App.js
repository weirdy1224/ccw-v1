import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

import PublicUserForm from './components/PublicUserForm';
import TrackRequest from './components/TrackRequest'; // NEW

import AdminLogin from './components/AdminLogin';
import PoliceLogin from './components/PoliceLogin';
import ControllerLogin from './components/ControllerLogin';

import AdminDashboard from './components/AdminDashboard';
import PoliceDashboard from './components/PoliceDashboard';
import ControllerDashboard from './components/ControllerDashboard';

import ProtectedRoute from './components/ProtectedRoute';

import './global.css';

const App = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <Router>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicUserForm />} />
        <Route path="/track" element={<TrackRequest />} />

        {/* Login Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/controller/login" element={<ControllerLogin />} />
        <Route path="/police/login" element={<PoliceLogin />} />

        {/* Dashboards (Protected by Role) */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/controller/dashboard" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ControllerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/police/dashboard" element={
          <ProtectedRoute allowedRoles={['police']}>
            <PoliceDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
