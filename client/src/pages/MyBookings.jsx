import { useEffect, useState } from 'react';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const user = JSON.parse(localStorage.getItem('smartbook_user') || 'null');

  const fetchBookings = () => {
    fetch(`http://localhost:5000/api/bookings/user/${user.id}`)
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    if (user?.id) fetchBookings();
  }, []);

  const cancelBooking = async (id) => {
    await fetch(`http://localhost:5000/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    fetchBookings();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>My Appointments</h2>
      {/* TODO (Member 4): Add Upcoming vs Past filter tabs & reschedule option */}
      {bookings.length === 0 ? (
        <p>You have no appointments yet.</p>
      ) : (
        bookings.map((b) => (
          <div key={b.id} style={{ border: '1px solid #444', padding: '14px', marginBottom: '10px', borderRadius: '6px' }}>
            <strong>{b.providers?.name}</strong> ({b.providers?.category})
            <p>📅 {b.appointment_date} at {b.appointment_time} — Status: <strong>{b.status}</strong></p>
            {b.status === 'pending' && (
              <button onClick={() => cancelBooking(b.id)} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                Cancel Appointment
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyBookings;