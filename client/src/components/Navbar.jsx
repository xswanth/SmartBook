import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem('smartbook_user') || 'null');
  } catch {
    localStorage.removeItem('smartbook_user');
  }

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('smartbook_user');
    localStorage.removeItem('smartbook_token');
    localStorage.removeItem('smartbook_provider');
    navigate('/login', { replace: true });
  };

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" to="/home">SmartBook</Link>
        <div className="site-nav-links" key={location.pathname}>
          <NavLink to="/home" end>Home</NavLink>

          {user.role === 'customer' && (
            <>
              <NavLink to="/explore">Find Services</NavLink>
              <NavLink to="/my-bookings">My Bookings</NavLink>
            </>
          )}

          {user.role === 'provider' && (
            <NavLink to="/provider-dashboard">Manage Schedule</NavLink>
          )}

          {(user.role === 'admin' || user.role === 'developer') && (
            <NavLink className="site-nav-admin" to="/admin">Admin Dashboard</NavLink>
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