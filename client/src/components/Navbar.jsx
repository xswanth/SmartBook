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
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" to="/home">SmartBook</Link>
        <div className="site-nav-links">
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
      </div>

      <div className="site-nav-account">
        <span>{user.name}</span>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;