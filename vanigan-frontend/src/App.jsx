import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';

import Landing from './pages/Landing';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Businesses from './pages/Businesses';
import UsersPage from './pages/UsersPage';
import Organizers from './pages/Organizers';
import Members from './pages/Members';
import Payments from './pages/Payments';

function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Admin panel */}
      <Route path="/admin" element={<AdminLayout />}>
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
