import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        localStorage.setItem('smartbook_token', data.session.access_token);
        localStorage.setItem('smartbook_user', JSON.stringify(data.profile));

        if (data.provider) {
          localStorage.setItem('smartbook_provider', JSON.stringify(data.provider));
        } else {
          localStorage.removeItem('smartbook_provider');
        }

        navigate('/home');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card auth-card-login">
        <span className="auth-eyebrow">SMARTBOOK</span>
        <h1>Welcome back</h1>
        <p className="auth-description">Sign in to continue to your account.</p>
        <form className="auth-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <p className="auth-switch">
          New to SmartBook? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;