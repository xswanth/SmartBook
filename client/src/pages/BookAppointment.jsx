import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function BookAppointment() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smartbook_user') || 'null');

  const [provider, setProvider] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Today's date in YYYY-MM-DD format (blocks past dates in the date picker)
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch(`http://localhost:5000/api/providers/${providerId}`)
      .then((res) => res.json())
      .then(setProvider)
      .catch((err) => console.error('Failed to load provider:', err));
  }, [providerId]);

  // Helper to check if a YYYY-MM-DD date matches provider.working_days
  const validateWorkingDay = (dateStr) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayName = days[new Date(year, month - 1, day).getDay()];

    if (!provider?.working_days) return { valid: true, dayName };

    const daysList = Array.isArray(provider.working_days)
      ? provider.working_days
      : String(provider.working_days)
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);

    if (daysList.length === 0) return { valid: true, dayName };

    const valid = daysList.some(
      (d) => d.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3))
    );
    return { valid, dayName };
  };

  // Handle date selection and validate past/non-working days
  const handleDateChange = (e) => {
    const chosenDate = e.target.value;
    setDate(chosenDate);
    setSelectedTime('');
    setSlots([]);
    setDateError('');

    if (!chosenDate) return;

    if (chosenDate < today) {
      setDateError('Past dates cannot be selected. Please pick today or a future date.');
      return;
    }

    const { valid, dayName } = validateWorkingDay(chosenDate);
    if (!valid) {
      setDateError(`Sorry, ${provider.name} is not available on ${dayName}s.`);
      return;
    }
  };

  // Fetch available slots only when a valid working date is chosen
  useEffect(() => {
    if (!date || dateError || !provider) return;

    setLoadingSlots(true);
    fetch(`http://localhost:5000/api/bookings/slots?provider_id=${providerId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setDateError('Failed to load available time slots.'))
      .finally(() => setLoadingSlots(false));
  }, [providerId, date, dateError, provider]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to book an appointment.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          provider_id: providerId,
          appointment_date: date,
          appointment_time: `${selectedTime}:00`,
          notes,
        }),
      });

      if (res.ok) {
        alert('Appointment booked!');
        navigate('/my-bookings');
      } else {
        const err = await res.json();
        alert(err.error || 'Booking failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!provider) return <p style={{ padding: '20px' }}>Loading provider...</p>;

  const formattedWorkingDays = Array.isArray(provider.working_days)
    ? provider.working_days.join(', ')
    : provider.working_days;

  return (
    <div style={{ maxWidth: '560px', margin: '30px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
        <h2 style={{ margin: '0 0 6px 0' }}>Book with {provider.name}</h2>
        {provider.category && (
          <p style={{ margin: '0 0 4px 0', color: '#9ca3af', fontSize: '0.95rem' }}>
            {provider.category} {provider.location ? `• ${provider.location}` : ''}
          </p>
        )}
        <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.9rem' }}>
          <strong>Working Days:</strong> {formattedWorkingDays || 'Not specified'}
        </p>
      </div>

      <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Step 1: Select Date (blocks past dates & non-working days) */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
            1. Select Date:
          </label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={handleDateChange}
            required
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #4b5563',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '0.95rem',
            }}
          />
          {dateError && (
            <p
              style={{
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '8px 12px',
                borderRadius: '6px',
                marginTop: '8px',
                fontSize: '0.9rem',
              }}
            >
              {dateError}
            </p>
          )}
        </div>

        {/* Step 2: Improved Time Slot Selection UI */}
        {date && !dateError && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: '600' }}>2. Select Time Slot:</label>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#9ca3af' }}>
                <span><span style={{ color: '#60a5fa' }}>■</span> Selected</span>
                <span><span style={{ color: '#22c55e' }}>■</span> Available</span>
                <span><span style={{ color: '#6b7280' }}>■</span> Booked</span>
              </div>
            </div>

            {loadingSlots ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Loading available slots...</p>
            ) : slots.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No time slots available on this date.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                  gap: '10px',
                }}
              >
                {slots.map((s) => {
                  const isSelected = selectedTime === s.time;
                  return (
                    <button
                      type="button"
                      key={s.time}
                      disabled={s.isBooked}
                      onClick={() => setSelectedTime(s.time)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        border: isSelected
                          ? '2px solid #60a5fa'
                          : s.isBooked
                          ? '1px solid #374151'
                          : '1px solid #4b5563',
                        cursor: s.isBooked ? 'not-allowed' : 'pointer',
                        backgroundColor: isSelected
                          ? '#2563eb'
                          : s.isBooked
                          ? '#1f2937'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: s.isBooked ? '#6b7280' : '#fff',
                        textDecoration: s.isBooked ? 'line-through' : 'none',
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: '0.9rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {s.time}
                      {s.isBooked && <div style={{ fontSize: '0.7rem' }}>Booked</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Optional Notes */}
        {selectedTime && !dateError && (
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              3. Notes or Reason for Visit (Optional):
            </label>
            <textarea
              rows="2"
              placeholder="Briefly describe your reason for visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '0.95rem',
              }}
            />
          </div>
        )}

        {/* Step 3: Clear Booking Summary Before Confirming */}
        {date && selectedTime && !dateError && (
          <div
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.14)',
              border: '1px solid #3b82f6',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#93c5fd' }}>
              Booking Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.92rem' }}>
              <div><strong>Provider:</strong> {provider.name}</div>
              {provider.category && <div><strong>Service:</strong> {provider.category}</div>}
              <div><strong>Date:</strong> {date}</div>
              <div><strong>Time Slot:</strong> {selectedTime}</div>
              {provider.fee && <div><strong>Fee:</strong> ₹{provider.fee}</div>}
              {notes.trim() && <div><strong>Notes:</strong> {notes.trim()}</div>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedTime || Boolean(dateError) || submitting}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: !selectedTime || dateError ? '#374151' : '#2563eb',
            color: !selectedTime || dateError ? '#9ca3af' : '#fff',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: !selectedTime || dateError || submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}

export default BookAppointment;