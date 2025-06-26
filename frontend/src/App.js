// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

import PublicUserForm from './components/PublicUserForm';
import TrackRequest from './components/TrackRequest';
import AdminLogin from './components/AdminLogin';
import PoliceLogin from './components/PoliceLogin';
import ControllerLogin from './components/ControllerLogin';

import AdminDashboard from './components/admin/AdminDashboard';
import ControllerDashboard from './components/controller/ControllerDashboard';
import PoliceDashboard from './components/police/PoliceDashboard';

import CreateController from './components/admin/CreateController';
import CreatePolice from './components/admin/CreatePolice';
import SearchRequests from './components/admin/SearchRequests';
import PoliceAssignments from './components/admin/PoliceAssignments';
import AdminRequests from './components/admin/AdminRequests';
import AdminDocuments from './components/admin/AdminDocuments';

import ProtectedRoute from './components/ProtectedRoute';

import ContCreatePolice from './components/controller/ContCreatePolice';
import ContSearchRequests from './components/controller/ContSearchRequests';
import ContPoliceAssignments from './components/controller/ContPoliceAssignments';
import ControllerRequests from './components/controller/ControllerRequests';
import ControllerDocuments from './components/controller/ControllerDocuments';

import './global.css';
import PoliceRequests from './components/police/PoliceRequests';
import PoliceDocuments from './components/police/PoliceDocuments';


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
        <Route path="/" element={<PublicUserForm />} />
        <Route path="/track" element={<TrackRequest />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/controller/login" element={<ControllerLogin />} />
        <Route path="/police/login" element={<PoliceLogin />} />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-controller" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateController />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-police" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreatePolice />
          </ProtectedRoute>
        } />
        <Route path="/controller/create-police" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ContCreatePolice />
          </ProtectedRoute>
        } />
        <Route path="/controller/dashboard" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ControllerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/search" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SearchRequests />
          </ProtectedRoute>
        } />
        <Route path="/controller/search" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ContSearchRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/police-assignments" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PoliceAssignments />
          </ProtectedRoute>
        } />
        <Route path="/controller/police-assignments" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ContPoliceAssignments />
          </ProtectedRoute>
        } />
        <Route path="/admin/requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRequests />
          </ProtectedRoute>
        } />
        <Route path="/controller/requests" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ControllerRequests />
          </ProtectedRoute>
        } />
        <Route path="/police/requests" element={
          <ProtectedRoute allowedRoles={['police']}>
            <PoliceRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/documents" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDocuments />
          </ProtectedRoute>
        } />
        <Route path="/controller/documents" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ControllerDocuments />
          </ProtectedRoute>
        } />
        <Route path="/police/documents" element={
          <ProtectedRoute allowedRoles={['police']}>
            <PoliceDocuments />
          </ProtectedRoute>
        } />
        <Route path="/police/dashboard" element={
          <ProtectedRoute allowedRoles={['police']}>
            <PoliceDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
