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
    <main className="home-page">
      <span className="home-eyebrow">YOUR TIME, WELL SPENT</span>
      <h1>Welcome back, {user.name}</h1>
      <p className="home-intro">A simpler way to discover trusted services and manage your appointments.</p>
      <p className="home-role">Signed in as <strong>{user.role}</strong></p>

      <div className="home-actions">
        {user.role === 'customer' && (
          <>
            <Link className="primary-link" to="/explore">Browse providers</Link>
            <Link className="secondary-link" to="/my-bookings">My appointments</Link>
          </>
        )}
        {user.role === 'provider' && (
          <Link className="primary-link" to="/provider-dashboard">Manage your schedule</Link>
        )}
        {(user.role === 'admin' || user.role === 'developer') && (
          <Link className="primary-link" to="/admin">Open admin dashboard</Link>
        )}
      </div>
    </main>
  );
}

export default Home;