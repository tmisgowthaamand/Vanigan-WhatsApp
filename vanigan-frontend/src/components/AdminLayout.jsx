import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Target, CreditCard, UserCog, Building2, Menu, X, Bot, LogOut } from 'lucide-react';
import { clearToken } from '../config';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/leads', icon: Target, label: 'Leads' },
  { to: '/admin/businesses', icon: Building2, label: 'Businesses' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/organizers', icon: UserCog, label: 'Organizers' },
  { to: '/admin/members', icon: Briefcase, label: 'Members' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
];

const s = {
  layout: { display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' },
  sidebar: { width: 260, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50, transition: 'transform 0.3s' },
  sidebarHidden: { transform: 'translateX(-100%)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 24px', borderBottom: '1px solid #334155', fontSize: '1.25rem', fontWeight: 700, color: '#fff' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  link: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.2s' },
  linkActive: { background: '#6366f1', color: '#fff' },
  main: { flex: 1, marginLeft: 260, padding: '24px 32px', minHeight: '100vh', overflow: 'auto' },
  topbar: { display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#1e293b', borderBottom: '1px solid #334155', zIndex: 40, alignItems: 'center', padding: '0 16px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }
};

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div style={s.layout}>
      {/* Mobile topbar */}
      <div style={{ ...s.topbar, display: isMobile ? 'flex' : 'none' }}>
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <Menu size={24} />
        </button>
        <span style={{ marginLeft: 12, fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>Vanigan Admin</span>
      </div>

      {/* Overlay */}
      {isMobile && open && <div style={s.overlay} onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside style={{ ...s.sidebar, ...(isMobile && !open ? s.sidebarHidden : {}) }}>
        <div style={s.logo}>
          <Bot size={28} color="#6366f1" />
          <span>Vanigan <span style={{ color: '#6366f1' }}>Admin</span></span>
          {isMobile && <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>}
        </div>
        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => isMobile && setOpen(false)}
              style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) })}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NavLink to="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.75rem' }}>Back to Website</NavLink>
          <button onClick={handleLogout} style={{ background: '#ef444420', border: 'none', color: '#ef4444', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 500 }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ ...s.main, ...(isMobile ? { marginLeft: 0, paddingTop: 72 } : {}) }}>
        <Outlet />
      </main>
    </div>
  );
}
