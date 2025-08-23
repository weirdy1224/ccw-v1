// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

import PublicUserForm from './components/PublicUserForm';
import TrackRequest from './components/TrackRequest';
import AdminLogin from './components/AdminLogin';
import CCPSLogin from './components/CCPSLogin';
import ControllerLogin from './components/ControllerLogin';

import AdminDashboard from './components/admin/AdminDashboard';
import ControllerDashboard from './components/controller/ControllerDashboard';
import CCPSDashboard from './components/CCPS/CCPSDashboard';

import CreateController from './components/admin/CreateController';
import CreateCCPS from './components/admin/CreateCCPS';
import SearchRequests from './components/admin/SearchRequests';
import CCPSAssignments from './components/admin/CCPSAssignments';
import AdminRequests from './components/admin/AdminRequests';
import AdminDocuments from './components/admin/AdminDocuments';
import AdminOverallReports from './components/admin/AdminOverallReports';

import ProtectedRoute from './components/ProtectedRoute';

import ContCreateCCPS from './components/controller/ContCreateCCPS';
import ContSearchRequests from './components/controller/ContSearchRequests';
import ContCCPSAssignments from './components/controller/ContCCPSAssignments';
import ControllerRequests from './components/controller/ControllerRequests';
import ControllerDocuments from './components/controller/ControllerDocuments';
import ContOverallReports from './components/controller/ContOverallReports';
import './global.css';
import CCPSRequests from './components/CCPS/CCPSRequests';
import CCPSDocuments from './components/CCPS/CCPSDocuments';


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
        <Route path="/CCPS/login" element={<CCPSLogin />} />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/overall-reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOverallReports />
          </ProtectedRoute>
        } />
        <Route path="/controller/overall-reports" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ContOverallReports />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-controller" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateController />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-CCPS" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateCCPS />
          </ProtectedRoute>
        } />
        <Route path="/controller/create-CCPS" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ContCreateCCPS />
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
        <Route path="/admin/CCPS-assignments" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CCPSAssignments />
          </ProtectedRoute>
        } />
        <Route path="/controller/CCPS-assignments" element={
          <ProtectedRoute allowedRoles={['controller']}>
            <ContCCPSAssignments />
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
        <Route path="/CCPS/requests" element={
          <ProtectedRoute allowedRoles={['CCPS']}>
            <CCPSRequests />
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
        <Route path="/CCPS/documents" element={
          <ProtectedRoute allowedRoles={['CCPS']}>
            <CCPSDocuments />
          </ProtectedRoute>
        } />
        <Route path="/CCPS/dashboard" element={
          <ProtectedRoute allowedRoles={['CCPS']}>
            <CCPSDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
