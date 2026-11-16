import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartbook_user') || 'null');

  if (!user) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #333', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
        <strong style={{ fontSize: '18px' }}>SmartBook</strong>
        <Link to="/home">Home</Link>

        {user.role === 'customer' && (
          <>
            <Link to="/explore">Find Services</Link>
            <Link to="/my-bookings">My Bookings</Link>
          </>
        )}

        {user.role === 'provider' && (
          <Link to="/provider-dashboard">Manage Schedule</Link>
        )}

        {(user.role === 'admin' || user.role === 'developer') && (
          <Link to="/admin">Admin Panel</Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span>{user.name} ({user.role})</span>
        <button onClick={handleLogout} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;