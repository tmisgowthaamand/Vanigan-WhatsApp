import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { API, authFetch } from '../config';
const API_BASE = import.meta.env.VITE_API_URL || 'https://vanigan-whatsapp-n2c1.onrender.com';
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid #334155', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: '0.9rem', color: '#e2e8f0' };
const card = { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' };
const filterBtn = (active) => ({ background: active ? '#6366f1' : '#0f172a', border: '1px solid #334155', color: active ? '#fff' : '#94a3b8', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 });

const statusBadge = (status) => {
  const map = { paid: { bg: '#22c55e20', color: '#22c55e' }, created: { bg: '#f59e0b20', color: '#f59e0b' }, failed: { bg: '#ef444420', color: '#ef4444' } };
  const s = map[status] || map.created;
  return { background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 };
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchPayments = () => {
    const params = new URLSearchParams({ page, limit: 15, ...(statusFilter && { status: statusFilter }) });
    authFetch(`${API}/payments?${params}`).then(r => r.json()).then(d => { setPayments(d.payments); setTotal(d.total); }).catch(console.error);
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const deletePayment = async (id) => {
    await authFetch(`${API}/payments/${id}`, { method: 'DELETE' });
    fetchPayments();
    showToast('Deleted successfully');
  };

  const markAsPaid = async (payment) => {
    try {
      const linkId = payment.razorpayPaymentLinkId || payment.razorpayOrderId;
      if (!linkId) { showToast('No payment link ID found'); return; }
      const res = await fetch(`${API_BASE}/razorpay/test-pay/${linkId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) {
        fetchPayments();
        showToast('Payment marked as paid! WhatsApp confirmation sent.');
      } else {
        showToast(data.error || 'Failed to mark as paid');
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>Payments ({total})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={filterBtn(!statusFilter)} onClick={() => { setStatusFilter(''); setPage(1); }}>All</button>
          <button style={filterBtn(statusFilter === 'paid')} onClick={() => { setStatusFilter('paid'); setPage(1); }}>Paid</button>
          <button style={filterBtn(statusFilter === 'created')} onClick={() => { setStatusFilter('created'); setPage(1); }}>Pending</button>
          <button style={filterBtn(statusFilter === 'failed')} onClick={() => { setStatusFilter('failed'); setPage(1); }}>Failed</button>
        </div>
      </div>

      <div style={card}>
        <table style={table}>
          <thead><tr>
            <th style={th}>WhatsApp Number</th>
            <th style={th}>Plan</th>
            <th style={th}>Amount</th>
            <th style={th}>Status</th>
            <th style={th}>Razorpay ID</th>
            <th style={th}>Date</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p._id}>
                <td style={{ ...td, fontWeight: 500 }}>{p.whatsappNumber}</td>
                <td style={td}><span style={{ background: '#8b5cf620', color: '#8b5cf6', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', textTransform: 'capitalize' }}>{p.plan}</span></td>
                <td style={td}>{p.currency} {p.amount}</td>
                <td style={td}><span style={statusBadge(p.status)}>{p.status === 'created' ? 'Pending' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                <td style={{ ...td, fontSize: '0.8rem', color: '#64748b' }}>{p.razorpayPaymentId || p.razorpayOrderId || '-'}</td>
                <td style={td}>{new Date(p.createdAt).toLocaleString('en-IN')}</td>
                <td style={{ ...td, display: 'flex', gap: 6 }}>
                  {p.status === 'created' && (
                    <button onClick={() => markAsPaid(p)} title="Mark as Paid (Test)" style={{ background: '#22c55e20', border: 'none', color: '#22c55e', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                      <CheckCircle size={14} /> Pay
                    </button>
                  )}
                  <button onClick={() => deletePayment(p._id)} title="Delete" style={{ background: '#ef444420', border: 'none', color: '#ef4444', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#64748b' }}>No payments found</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page > 1 ? 1 : 0.4 }}><ChevronLeft size={16} /></button>
        <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.85rem' }}>Page {page}</span>
        <button disabled={payments.length < 15} onClick={() => setPage(p => p + 1)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: payments.length >= 15 ? 'pointer' : 'not-allowed', opacity: payments.length >= 15 ? 1 : 0.4 }}><ChevronRight size={16} /></button>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 500, fontSize: '0.9rem', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}
    </div>
  );
}
