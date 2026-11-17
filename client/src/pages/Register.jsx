import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');

  // Provider-specific fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('doctor');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      email,
      phone,
      password,
      role,
    };

    if (role === 'provider') {
      if (selectedDays.length === 0) {
        setError('Please select at least one working day.');
        setLoading(false);
        return;
      }
      payload.business_name = businessName;
      payload.category = category;
      payload.location = location;
      payload.description = description;
      payload.working_days = selectedDays.join(',');
      payload.start_time = `${startTime}:00`;
      payload.end_time = `${endTime}:00`;
      payload.slot_duration = Number(slotDuration);
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        alert('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen auth-screen-register">
      <section className="auth-card auth-card-register">
        <span className="auth-eyebrow">SMARTBOOK</span>
        <h1>Create your account</h1>
        <p className="auth-description">A few details to get started.</p>
        <form className="auth-form" onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Full Name"
          aria-label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          aria-label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <label className="auth-field-label">
          Register As:
        </label>
        <select
          aria-label="Register as"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="customer">Customer (Book Appointments)</option>
          <option value="provider">Service Provider (Manage Schedule)</option>
        </select>

        {role === 'provider' && (
          <div className="provider-fields">
            <strong>Business &amp; Schedule Details</strong>

            <input
              type="text"
              placeholder="Clinic / Salon / Business Name"
              aria-label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />

            <select
              aria-label="Business category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="doctor">Doctor / Clinic</option>
              <option value="hospital">Hospital</option>
              <option value="salon">Salon / Spa</option>
              <option value="other">Other Service</option>
            </select>

            <input
              type="text"
              placeholder="Location / City"
              aria-label="Location or city"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <textarea
              placeholder="Short description of services"
              aria-label="Description of services"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            <div>
              <span className="auth-field-label">Working days:</span>
              <div className="auth-days">
                {DAYS_LIST.map((day) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    aria-pressed={selectedDays.includes(day)}
                    style={{
                      backgroundColor: selectedDays.includes(day) ? '#356b58' : '#fff',
                      borderColor: selectedDays.includes(day) ? '#356b58' : '#d9e2dc',
                      color: selectedDays.includes(day) ? '#fff' : '#59665e',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-time-fields">
              <div>
                <label className="auth-field-label">Start time</label>
                <input
                  type="time"
                  aria-label="Start time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="auth-field-label">End time</label>
                <input
                  type="time"
                  aria-label="End time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="auth-field-label">
                Appointment slot duration
              </label>
              <select
                aria-label="Appointment slot duration"
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 hour)</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;