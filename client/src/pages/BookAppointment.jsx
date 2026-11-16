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

  useEffect(() => {
    fetch(`http://localhost:5000/api/providers/${providerId}`)
      .then((res) => res.json())
      .then(setProvider);
  }, [providerId]);

  useEffect(() => {
    if (!date) return;
    fetch(`http://localhost:5000/api/bookings/slots?provider_id=${providerId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(Array.isArray(data) ? data : []));
  }, [providerId, date]);

  const handleBook = async (e) => {
    e.preventDefault();
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
  };

  if (!provider) return <p style={{ padding: '20px' }}>Loading provider...</p>;

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>Book with {provider.name}</h2>
      <p>Working Days: {provider.working_days}</p>

      {/* TODO (Member 3): Block dates that don't match provider.working_days */}
      <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label>Select Date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '8px' }} />

        {date && (
          <div>
            <label>Select Time Slot:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.time}
                  disabled={s.isBooked}
                  onClick={() => setSelectedTime(s.time)}
                  style={{
                    padding: '8px 12px',
                    cursor: s.isBooked ? 'not-allowed' : 'pointer',
                    backgroundColor: selectedTime === s.time ? '#2563eb' : s.isBooked ? '#555' : 'transparent',
                    color: '#fff',
                  }}
                >
                  {s.time} {s.isBooked ? '(Booked)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          placeholder="Notes or reason for visit (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ padding: '8px' }}
        />

        <button type="submit" disabled={!selectedTime} style={{ padding: '10px', cursor: 'pointer' }}>
          Confirm Booking
        </button>
      </form>
    </div>
  );
}

export default BookAppointment;