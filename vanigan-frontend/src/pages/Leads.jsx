import React, { useEffect, useState } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const API = '/api/admin';
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid #334155', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: '0.9rem', color: '#e2e8f0' };
const card = { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' };
const badge = (color) => ({ background: `${color}20`, color, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 });
const inputStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px 8px 36px', color: '#e2e8f0', fontSize: '0.9rem', width: 280, outline: 'none' };

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchLeads = () => {
    const params = new URLSearchParams({ page, limit: 15, ...(search && { search }) });
    fetch(`${API}/leads?${params}`).then(r => r.json()).then(d => { setLeads(d.leads); setTotal(d.total); }).catch(console.error);
  };

  useEffect(() => { fetchLeads(); }, [page, search]);

  const stateColors = {
    'choose_service': '#6366f1', 'business_list': '#10b981', 'organizer_district': '#f59e0b',
    'member_district': '#06b6d4', 'add_business_name': '#f43f5e', 'subscription_plans': '#8b5cf6',
    'waiting_for_payment': '#eab308'
  };

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.9rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={16} /> Back to Leads
        </button>
        <div style={card}>
          <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Lead: {selected.whatsappNumber}</h2>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Total Interactions</span><div style={{ color: '#fff', fontWeight: 600 }}>{selected.totalInteractions}</div></div>
              <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Last State</span><div><span style={badge(stateColors[selected.lastState] || '#64748b')}>{selected.lastState}</span></div></div>
              <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>First Contact</span><div style={{ color: '#fff' }}>{new Date(selected.firstContactAt).toLocaleString('en-IN')}</div></div>
              <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Last Activity</span><div style={{ color: '#fff' }}>{new Date(selected.lastActivityAt).toLocaleString('en-IN')}</div></div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>Activity Trail ({selected.actions?.length || 0} actions)</h3>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {selected.actions?.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #334155' }}>
                  <div style={{ minWidth: 32, height: 32, borderRadius: '50%', background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={badge(stateColors[a.state] || '#64748b')}>{a.state}</span>
                      <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>{a.action}</span>
                      {a.input && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>input: "{a.input}"</span>}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2 }}>{new Date(a.timestamp).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>Leads ({total})</h1>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
          <input style={inputStyle} placeholder="Search by number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div style={card}>
        <table style={table}>
          <thead><tr>
            <th style={th}>WhatsApp Number</th>
            <th style={th}>Last State</th>
            <th style={th}>Interactions</th>
            <th style={th}>First Contact</th>
            <th style={th}>Last Activity</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {leads.map(l => (
              <tr key={l._id} style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={td}><span style={{ fontWeight: 500 }}>{l.whatsappNumber}</span></td>
                <td style={td}><span style={badge(stateColors[l.lastState] || '#64748b')}>{l.lastState}</span></td>
                <td style={td}>{l.totalInteractions}</td>
                <td style={td}>{new Date(l.firstContactAt).toLocaleDateString('en-IN')}</td>
                <td style={td}>{new Date(l.lastActivityAt).toLocaleString('en-IN')}</td>
                <td style={td}>
                  <button onClick={() => { fetch(`${API}/leads/${l._id}`).then(r => r.json()).then(setSelected); }} style={{ background: '#6366f120', border: 'none', color: '#6366f1', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#64748b' }}>No leads found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4 }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.85rem' }}>Page {page}</span>
        <button disabled={leads.length < 15} onClick={() => setPage(p => p + 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: leads.length >= 15 ? 'pointer' : 'not-allowed', opacity: leads.length >= 15 ? 1 : 0.4 }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
