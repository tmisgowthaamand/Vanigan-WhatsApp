import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { isLoggedIn } from './config';

import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Businesses from './pages/Businesses';
import UsersPage from './pages/UsersPage';
import Organizers from './pages/Organizers';
import Members from './pages/Members';
import Payments from './pages/Payments';

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Admin login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Admin panel (protected) */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="organizers" element={<Organizers />} />
        <Route path="members" element={<Members />} />
        <Route path="payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}

export default App;
