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
    <div style={{ maxWidth: '450px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>SmartBook — Create Account</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '15px' }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '15px' }}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '10px', fontSize: '15px' }}
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          style={{ padding: '10px', fontSize: '15px' }}
        />

        <label style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
          Register As:
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: '10px', fontSize: '15px' }}
        >
          <option value="customer">Customer (Book Appointments)</option>
          <option value="provider">Service Provider (Manage Schedule)</option>
        </select>

        {role === 'provider' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', border: '1px solid #444', borderRadius: '6px' }}>
            <strong style={{ fontSize: '15px' }}>Business & Schedule Details</strong>

            <input
              type="text"
              placeholder="Clinic / Salon / Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              style={{ padding: '10px', fontSize: '15px' }}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '10px', fontSize: '15px' }}
            >
              <option value="doctor">Doctor / Clinic</option>
              <option value="hospital">Hospital</option>
              <option value="salon">Salon / Spa</option>
              <option value="other">Other Service</option>
            </select>

            <input
              type="text"
              placeholder="Location / City"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              style={{ padding: '10px', fontSize: '15px' }}
            />

            <textarea
              placeholder="Short description of services"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ padding: '10px', fontSize: '15px' }}
            />

            <div>
              <span style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Working Days:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DAYS_LIST.map((day) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      border: '1px solid #666',
                      backgroundColor: selectedDays.includes(day) ? '#2563eb' : 'transparent',
                      color: selectedDays.includes(day) ? '#fff' : 'inherit',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Appointment Slot Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '15px' }}
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
          style={{ padding: '12px', fontSize: '16px', cursor: 'pointer', marginTop: '4px' }}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}

      <p style={{ marginTop: '16px' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register;