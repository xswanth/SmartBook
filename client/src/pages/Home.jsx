import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('smartbook_token');
    const savedUser = localStorage.getItem('smartbook_user');

    if (!token || !savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('smartbook_token');
    localStorage.removeItem('smartbook_user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '700px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>SmartBook Home</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <p>
        Welcome back, <strong>{user.name}</strong>!
      </p>
      <p>
        Role: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{user.role}</span>
      </p>

      <hr style={{ margin: '24px 0' }} />

      {user.role === 'customer' && (
        <div>
          <h3>Book an Appointment</h3>
          <p>Select a doctor, salon, or service provider to view available slots.</p>
        </div>
      )}

      {user.role === 'provider' && (
        <div>
          <h3>Provider Dashboard</h3>
          <p>Manage your upcoming appointments and available time slots.</p>
        </div>
      )}

      {(user.role === 'admin' || user.role === 'developer') && (
        <div>
          <h3>Admin Monitor</h3>
          <p>Overview of all service providers, users, and system bookings.</p>
        </div>
      )}
    </div>
  );
}

export default Home;