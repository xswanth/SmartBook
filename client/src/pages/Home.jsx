import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('smartbook_user');
    if (!saved) navigate('/login');
    else setUser(JSON.parse(saved));
  }, [navigate]);

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Welcome to SmartBook, {user.name}</h1>
      <p>Logged in as: <strong>{user.role.toUpperCase()}</strong></p>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        {user.role === 'customer' && (
          <>
            <Link to="/explore"><button style={{ padding: '10px 16px' }}>Browse Providers</button></Link>
            <Link to="/my-bookings"><button style={{ padding: '10px 16px' }}>My Appointments</button></Link>
          </>
        )}
        {user.role === 'provider' && (
          <Link to="/provider-dashboard"><button style={{ padding: '10px 16px' }}>Open Provider Dashboard</button></Link>
        )}
        {(user.role === 'admin' || user.role === 'developer') && (
          <Link to="/admin"><button style={{ padding: '10px 16px' }}>Open Admin Monitor</button></Link>
        )}
      </div>
    </div>
  );
}

export default Home;