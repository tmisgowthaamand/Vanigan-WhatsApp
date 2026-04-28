import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { API } from '../config';
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid #334155', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: '0.9rem', color: '#e2e8f0' };
const card = { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' };
const inputStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px 8px 36px', color: '#e2e8f0', fontSize: '0.9rem', width: 280, outline: 'none' };
const badge = (bg, color) => ({ background: bg, color, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 });

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    const params = new URLSearchParams({ page, limit: 15, ...(search && { search }) });
    fetch(`${API}/users?${params}`).then(r => r.json()).then(d => { setUsers(d.users); setTotal(d.total); }).catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await fetch(`${API}/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  const subBadge = (status) => {
    if (status === 'active') return badge('#22c55e20', '#22c55e');
    if (status === 'pending') return badge('#f59e0b20', '#f59e0b');
    return badge('#64748b20', '#64748b');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>Users ({total})</h1>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
          <input style={inputStyle} placeholder="Search by number or name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div style={card}>
        <table style={table}>
          <thead><tr>
            <th style={th}>WhatsApp Number</th>
            <th style={th}>Name</th>
            <th style={th}>Language</th>
            <th style={th}>Current State</th>
            <th style={th}>Subscription</th>
            <th style={th}>Last Updated</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td style={{ ...td, fontWeight: 500 }}>{u.whatsappNumber}</td>
                <td style={td}>{u.name || '-'}</td>
                <td style={td}>{u.language === 'ta' ? 'Tamil' : 'English'}</td>
                <td style={td}><span style={badge('#6366f120', '#6366f1')}>{u.currentState}</span></td>
                <td style={td}><span style={subBadge(u.subscription?.status)}>{u.subscription?.status || 'none'}{u.subscription?.plan ? ` (${u.subscription.plan})` : ''}</span></td>
                <td style={td}>{new Date(u.updatedAt).toLocaleString('en-IN')}</td>
                <td style={td}>
                  <button onClick={() => deleteUser(u._id)} title="Delete" style={{ background: '#ef444420', border: 'none', color: '#ef4444', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>No users found</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4 }}><ChevronLeft size={16} /></button>
        <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.85rem' }}>Page {page}</span>
        <button disabled={users.length < 15} onClick={() => setPage(p => p + 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: users.length >= 15 ? 'pointer' : 'not-allowed', opacity: users.length >= 15 ? 1 : 0.4 }}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
