import { useEffect, useState } from 'react';

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, providers: 0, appointments: 0 });
  const [providers, setProviders] = useState([]);

  const loadAdminData = () => {
    fetch('http://localhost:5000/api/admin/stats').then((r) => r.json()).then(setStats);
    fetch('http://localhost:5000/api/admin/providers').then((r) => r.json()).then((d) => setProviders(Array.isArray(d) ? d : []));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const toggleApproval = async (id, currentStatus) => {
    await fetch(`http://localhost:5000/api/admin/providers/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_approved: !currentStatus }),
    });
    loadAdminData();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>Admin Monitor</h2>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, border: '1px solid #444', padding: '16px', borderRadius: '6px' }}>Users: <strong>{stats.users}</strong></div>
        <div style={{ flex: 1, border: '1px solid #444', padding: '16px', borderRadius: '6px' }}>Providers: <strong>{stats.providers}</strong></div>
        <div style={{ flex: 1, border: '1px solid #444', padding: '16px', borderRadius: '6px' }}>Bookings: <strong>{stats.appointments}</strong></div>
      </div>

      {/* TODO (Member 6): Add all-bookings monitor table & user management list */}
      <h3>Manage Service Providers</h3>
      {providers.map((p) => (
        <div key={p.id} style={{ border: '1px solid #444', padding: '14px', marginBottom: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{p.name}</strong> ({p.category}) — Owner: {p.profiles?.email}
            <p>Status: {p.is_approved ? '✅ Approved' : '⏳ Pending Approval'}</p>
          </div>
          <button onClick={() => toggleApproval(p.id, p.is_approved)} style={{ padding: '8px 14px', cursor: 'pointer' }}>
            {p.is_approved ? 'Suspend' : 'Approve'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;