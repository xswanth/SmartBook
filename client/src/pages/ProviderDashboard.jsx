import { useEffect, useState } from 'react';

function ProviderDashboard() {
  const provider = JSON.parse(localStorage.getItem('smartbook_provider') || 'null');
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = () => {
    if (!provider?.id) return;
    fetch(`http://localhost:5000/api/bookings/provider/${provider.id}`)
      .then((res) => res.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
  };

  if (!provider) return <p style={{ padding: '20px' }}>No provider profile found.</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>{provider.name} — Provider Dashboard</h2>

      {!provider.is_approved && (
        <div style={{ padding: '12px', backgroundColor: '#78350f', color: '#fef3c7', marginBottom: '16px', borderRadius: '6px' }}>
          ⏳ Your listing is pending Admin approval. Customers cannot book until approved.
        </div>
      )}

      {/* TODO (Member 5): Add form to edit working_days, start_time, end_time & slot_duration */}
      <h3>Incoming Appointments</h3>
      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        appointments.map((a) => (
          <div key={a.id} style={{ border: '1px solid #444', padding: '14px', marginBottom: '10px', borderRadius: '6px' }}>
            <p><strong>Customer:</strong> {a.profiles?.name} ({a.profiles?.phone || a.profiles?.email})</p>
            <p><strong>When:</strong> {a.appointment_date} at {a.appointment_time} | <strong>Status:</strong> {a.status}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>
              <button onClick={() => updateStatus(a.id, 'completed')}>Mark Completed</button>
              <button onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ProviderDashboard;