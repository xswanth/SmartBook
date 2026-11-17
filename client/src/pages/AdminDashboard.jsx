
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api/admin';

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    providers: 0,
    appointments: 0,
  });

  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  const [searchBookings, setSearchBookings] = useState('');
  const [bookingStatus, setBookingStatus] = useState('All');

  const [searchUsers, setSearchUsers] = useState('');
  const [userRole, setUserRole] = useState('All');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load all admin information
  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, providersRes, bookingsRes, usersRes] =
        await Promise.all([
          fetch(`${API}/stats`),
          fetch(`${API}/providers`),
          fetch(`${API}/bookings`),
          fetch(`${API}/users`),
        ]);

      const responses = [
        statsRes,
        providersRes,
        bookingsRes,
        usersRes,
      ];

      if (responses.some((res) => !res.ok)) {
        throw new Error('Unable to load admin information.');
      }

      const [statsData, providersData, bookingsData, usersData] =
        await Promise.all(responses.map((res) => res.json()));

      setStats(statsData);
      setProviders(Array.isArray(providersData) ? providersData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Approve or suspend a provider
  const toggleApproval = async (id, currentStatus) => {
    try {
      const response = await fetch(
        `${API}/providers/${id}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: !currentStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Provider status update failed.');
      }

      await loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const customer = b.customer_name || b.profiles?.name || '';
    const provider = b.provider_name || b.providers?.name || '';

    const matchesSearch =
      `${customer} ${provider} ${b.id} ${b.service_name || ''}`
        .toLowerCase()
        .includes(searchBookings.toLowerCase());

    const matchesStatus =
      bookingStatus === 'All' ||
      (b.status || '').toLowerCase() === bookingStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Filter registered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      `${u.name || ''} ${u.email || ''}`
        .toLowerCase()
        .includes(searchUsers.toLowerCase());

    const matchesRole =
      userRole === 'All' ||
      (u.role || '').toLowerCase() === userRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const sectionStyle = {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '25px',
    border: '1px solid #e5e7eb',
    overflowX: 'auto',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '650px',
  };

  const thStyle = {
    padding: '12px',
    background: '#f3f4f6',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee',
  };

  const inputStyle = {
    padding: '10px',
    margin: '8px 10px 15px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
  };

  const statusStyle = (status) => ({
    padding: '5px 10px',
    borderRadius: '15px',
    fontSize: '12px',
    background:
      status === 'completed' || status === 'approved'
        ? '#dcfce7'
        : status === 'cancelled' || status === 'rejected'
        ? '#fee2e2'
        : '#fef3c7',
    color:
      status === 'completed' || status === 'approved'
        ? '#166534'
        : status === 'cancelled' || status === 'rejected'
        ? '#991b1b'
        : '#92400e',
  });

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '30px auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        background: '#f9fafb',
      }}
    >
      <h2>Admin Monitoring Dashboard</h2>
      <p>Monitor bookings, registered users and service providers.</p>

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      <button onClick={loadAdminData} style={{ padding: '9px 15px' }}>
        Refresh Dashboard
      </button>

      {loading ? (
        <p>Loading admin information...</p>
      ) : (
        <>
          {/* STATISTICS */}
          <div
            style={{
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap',
              margin: '25px 0',
            }}
          >
            {[
              ['Total Users', stats.users],
              ['Total Providers', stats.providers],
              ['Total Bookings', stats.appointments],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  flex: '1',
                  minWidth: '180px',
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >
                <p>{label}</p>
                <h2>{value}</h2>
              </div>
            ))}
          </div>

          {/* ALL BOOKINGS */}
          <section style={sectionStyle}>
            <h3>All Bookings Monitor</h3>

            <input
              style={inputStyle}
              placeholder="Search customer, provider or booking..."
              value={searchBookings}
              onChange={(e) => setSearchBookings(e.target.value)}
            />

            <select
              style={inputStyle}
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Booking ID</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Provider</th>
                  <th style={thStyle}>Service</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td style={tdStyle}>{b.id}</td>
                      <td style={tdStyle}>
                        {b.customer_name || b.profiles?.name || 'N/A'}
                      </td>
                      <td style={tdStyle}>
                        {b.provider_name || b.providers?.name || 'N/A'}
                      </td>
                      <td style={tdStyle}>
                        {b.service_name || b.providers?.category || 'N/A'}
                      </td>
                      <td style={tdStyle}>
                        {b.appointment_date
                          ? new Date(b.appointment_date).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td style={tdStyle}>
                        <span style={statusStyle(
                          (b.status || 'pending').toLowerCase()
                        )}>
                          {b.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={tdStyle}>
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* REGISTERED USERS */}
          <section style={sectionStyle}>
            <h3>Registered Users</h3>

            <input
              style={inputStyle}
              placeholder="Search by name or email..."
              value={searchUsers}
              onChange={(e) => setSearchUsers(e.target.value)}
            />

            <select
              style={inputStyle}
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
            </select>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>User ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{u.id}</td>
                      <td style={tdStyle}>{u.name || 'N/A'}</td>
                      <td style={tdStyle}>{u.email || 'N/A'}</td>
                      <td style={tdStyle}>
                        <span style={statusStyle('approved')}>
                          {u.role || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={tdStyle}>
                      No registered users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* PROVIDER APPROVAL */}
          <section style={sectionStyle}>
            <h3>Manage Service Providers</h3>

            {providers.length === 0 ? (
              <p>No service providers registered.</p>
            ) : (
              providers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '15px',
                    marginBottom: '12px',
                    borderRadius: '7px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong>{p.name}</strong>
                    <p>Category: {p.category || 'N/A'}</p>
                    <p>Owner: {p.profiles?.email || 'N/A'}</p>
                    <p>
                      Status:{' '}
                      <span style={statusStyle(
                        p.is_approved ? 'approved' : 'pending'
                      )}>
                        {p.is_approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => toggleApproval(p.id, p.is_approved)}
                    style={{
                      padding: '9px 15px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      color: '#fff',
                      background: p.is_approved ? '#dc2626' : '#16a34a',
                    }}
                  >
                    {p.is_approved ? 'Suspend' : 'Approve'}
                  </button>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
