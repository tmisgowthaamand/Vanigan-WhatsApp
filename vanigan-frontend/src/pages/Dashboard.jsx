import React, { useEffect, useState } from 'react';
import { Users, Building2, Target, CreditCard, UserCog, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { API } from '../config';

const card = {
  background: '#1e293b', borderRadius: 12, padding: '24px', border: '1px solid #334155',
};
const statNum = { fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1 };
const statLabel = { fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 };
const iconBox = (bg) => ({ width: 48, height: 48, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/dashboard`).then(r => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#94a3b8', padding: 40 }}>Loading dashboard...</div>;
  if (!data) return <div style={{ color: '#f87171', padding: 40 }}>Failed to load dashboard data.</div>;

  const { stats, recentLeads, recentPayments } = data;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: '#6366f120', color: '#6366f1' },
    { label: 'Total Businesses', value: stats.totalBusinesses, icon: Building2, bg: '#10b98120', color: '#10b981' },
    { label: 'Pending Approval', value: stats.pendingBusinesses, icon: Clock, bg: '#f5970020', color: '#f59700' },
    { label: 'Active Leads', value: stats.totalLeads, icon: Target, bg: '#f4364f20', color: '#f4364f' },
    { label: 'Organizers', value: stats.totalOrganizers, icon: UserCog, bg: '#8b5cf620', color: '#8b5cf6' },
    { label: 'Members', value: stats.totalMembers, icon: Briefcase, bg: '#06b6d420', color: '#06b6d4' },
    { label: 'Payments', value: stats.totalPayments, icon: CreditCard, bg: '#22c55e20', color: '#22c55e' },
    { label: 'Active Subs', value: stats.activeSubscriptions, icon: TrendingUp, bg: '#eab30820', color: '#eab308' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 24, color: '#fff' }}>Dashboard</h1>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={iconBox(s.bg)}><s.icon size={24} color={s.color} /></div>
              <div>
                <div style={statNum}>{s.value}</div>
                <div style={statLabel}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Leads */}
        <div style={card}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#fff' }}>Recent Leads</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentLeads?.length === 0 && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No leads yet</div>}
            {recentLeads?.slice(0, 8).map((lead, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500 }}>{lead.whatsappNumber}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Last: {lead.lastState} | {lead.totalInteractions} actions</div>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{new Date(lead.lastActivityAt).toLocaleDateString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div style={card}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: '#fff' }}>Recent Payments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentPayments?.length === 0 && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No payments yet</div>}
            {recentPayments?.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500 }}>{p.whatsappNumber}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{p.plan} - Rs.{p.amount}</div>
                </div>
                <span style={{ background: '#22c55e20', color: '#22c55e', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem' }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
