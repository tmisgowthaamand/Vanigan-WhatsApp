import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { API } from '../config';
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid #334155', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: '0.9rem', color: '#e2e8f0' };
const card = { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' };
const inputStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px 8px 36px', color: '#e2e8f0', fontSize: '0.9rem', width: 240, outline: 'none' };
const filterBtn = (active) => ({ background: active ? '#6366f1' : '#0f172a', border: '1px solid #334155', color: active ? '#fff' : '#94a3b8', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 });

const statusBadge = (status) => {
  const map = { approved: { bg: '#22c55e20', color: '#22c55e' }, pending: { bg: '#f59e0b20', color: '#f59e0b' }, rejected: { bg: '#ef444420', color: '#ef4444' } };
  const s = map[status] || map.pending;
  return { background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 };
};

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = () => {
    const params = new URLSearchParams({ page, limit: 15, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
    fetch(`${API}/businesses?${params}`).then(r => r.json()).then(d => { setBusinesses(d.businesses); setTotal(d.total); }).catch(console.error);
  };

  useEffect(() => { fetchData(); }, [page, search, statusFilter]);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/businesses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>Businesses ({total})</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={filterBtn(!statusFilter)} onClick={() => { setStatusFilter(''); setPage(1); }}>All</button>
          <button style={filterBtn(statusFilter === 'pending')} onClick={() => { setStatusFilter('pending'); setPage(1); }}>Pending</button>
          <button style={filterBtn(statusFilter === 'approved')} onClick={() => { setStatusFilter('approved'); setPage(1); }}>Approved</button>
          <button style={filterBtn(statusFilter === 'rejected')} onClick={() => { setStatusFilter('rejected'); setPage(1); }}>Rejected</button>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
          <input style={inputStyle} placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div style={card}>
        <table style={table}>
          <thead><tr>
            <th style={th}>Business Name</th>
            <th style={th}>District</th>
            <th style={th}>Assembly</th>
            <th style={th}>Contact</th>
            <th style={th}>Owner WA</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {businesses.map(b => (
              <tr key={b._id}>
                <td style={{ ...td, fontWeight: 500 }}>{b.businessName}</td>
                <td style={td}>{b.district}</td>
                <td style={td}>{b.assembly}</td>
                <td style={td}>{b.contact}</td>
                <td style={td}>{b.ownerWhatsapp}</td>
                <td style={td}><span style={statusBadge(b.status)}>{b.status}</span></td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {b.status !== 'approved' && (
                      <button onClick={() => updateStatus(b._id, 'approved')} title="Approve" style={{ background: '#22c55e20', border: 'none', color: '#22c55e', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {b.status !== 'rejected' && (
                      <button onClick={() => updateStatus(b._id, 'rejected')} title="Reject" style={{ background: '#ef444420', border: 'none', color: '#ef4444', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
                        <XCircle size={16} />
                      </button>
                    )}
                    {b.status !== 'pending' && (
                      <button onClick={() => updateStatus(b._id, 'pending')} title="Set Pending" style={{ background: '#f59e0b20', border: 'none', color: '#f59e0b', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
                        <Clock size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {businesses.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>No businesses found</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4 }}><ChevronLeft size={16} /></button>
        <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.85rem' }}>Page {page}</span>
        <button disabled={businesses.length < 15} onClick={() => setPage(p => p + 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: businesses.length >= 15 ? 'pointer' : 'not-allowed', opacity: businesses.length >= 15 ? 1 : 0.4 }}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
