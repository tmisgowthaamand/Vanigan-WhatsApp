import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { API } from '../config';
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid #334155', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: '0.9rem', color: '#e2e8f0' };
const card = { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' };
const inputStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px 8px 36px', color: '#e2e8f0', fontSize: '0.9rem', width: 280, outline: 'none' };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchMembers = () => {
    const params = new URLSearchParams({ page, limit: 15, ...(search && { search }) });
    fetch(`${API}/members?${params}`).then(r => r.json()).then(d => { setMembers(d.members); setTotal(d.total); }).catch(console.error);
  };

  useEffect(() => {
    fetchMembers();
  }, [page, search]);

  const deleteMember = async (id) => {
    await fetch(`${API}/members/${id}`, { method: 'DELETE' });
    fetchMembers();
    showToast('Deleted successfully');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>Members ({total})</h1>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
          <input style={inputStyle} placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div style={card}>
        <table style={table}>
          <thead><tr>
            <th style={th}>Name</th>
            <th style={th}>Position</th>
            <th style={th}>Business</th>
            <th style={th}>District</th>
            <th style={th}>Assembly</th>
            <th style={th}>Contact for member</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m._id}>
                <td style={{ ...td, fontWeight: 500 }}>{m.name}</td>
                <td style={td}><span style={{ background: '#06b6d420', color: '#06b6d4', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem' }}>{m.position || 'Member'}</span></td>
                <td style={td}>{m.businessName || '-'}</td>
                <td style={td}>{m.district}</td>
                <td style={td}>{m.assembly}</td>
                <td style={td}>{m.contact}</td>
                <td style={td}>
                  <button onClick={() => deleteMember(m._id)} title="Delete" style={{ background: '#ef444420', border: 'none', color: '#ef4444', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>No members found</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4 }}><ChevronLeft size={16} /></button>
        <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.85rem' }}>Page {page}</span>
        <button disabled={members.length < 15} onClick={() => setPage(p => p + 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: members.length >= 15 ? 'pointer' : 'not-allowed', opacity: members.length >= 15 ? 1 : 0.4 }}><ChevronRight size={16} /></button>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 500, fontSize: '0.9rem', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}
    </div>
  );
}
