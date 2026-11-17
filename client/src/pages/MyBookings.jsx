import { useCallback, useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/bookings';

function isUpcoming(booking) {
  if (booking.status === 'cancelled' || booking.status === 'completed') return false;
  const appointment = new Date(`${booking.appointment_date}T${booking.appointment_time}`);
  return !Number.isNaN(appointment.getTime()) && appointment >= new Date();
}

function MyBookings() {
  const user = JSON.parse(localStorage.getItem('smartbook_user') || 'null');
  const userId = user?.id;
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [activeRescheduleId, setActiveRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(Boolean(userId));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [today] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  const fetchBookings = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_URL}/user/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load appointments.');
      setBookings(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const activeProviderId = bookings.find((item) => item.id === activeRescheduleId)?.provider_id;
  useEffect(() => {
    if (!activeProviderId || !rescheduleDate) return;

    const controller = new AbortController();
    fetch(`${API_URL}/slots?provider_id=${activeProviderId}&date=${rescheduleDate}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load available times.');
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      });

    return () => controller.abort();
  }, [activeProviderId, rescheduleDate]);

  const cancelBooking = async (id) => {
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not cancel appointment.');
      await fetchBookings();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);

    try {
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update your profile.');

      const updatedUser = { ...user, ...data };
      localStorage.setItem('smartbook_user', JSON.stringify(updatedUser));
      setProfileName(updatedUser.name || '');
      setProfilePhone(updatedUser.phone || '');
      setMessage('Your details have been updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveReschedule = async (event, booking) => {
    event.preventDefault();
    if (!selectedTime) return;

    setError('');
    setMessage('');
    setSavingReschedule(true);
    try {
      const response = await fetch(`${API_URL}/${booking.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_date: rescheduleDate,
          appointment_time: `${selectedTime}:00`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not reschedule appointment.');

      setActiveRescheduleId(null);
      setMessage('Your appointment has been rescheduled.');
      await fetchBookings();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingReschedule(false);
    }
  };

  const visibleBookings = bookings.filter((booking) => (
    activeTab === 'upcoming' ? isUpcoming(booking) : !isUpcoming(booking)
  ));
  const availableSlots = slots.filter((slot) => !slot.isBooked);
  return (
    <main style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px 36px' }}>
      <h2>My Appointments</h2>

      <section style={{ marginBottom: '28px', padding: '20px', border: '1px solid #e4e9e5', borderRadius: '12px', background: '#fff' }}>
        <h3 style={{ marginBottom: '16px' }}>Your details</h3>
        <form onSubmit={saveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            Name
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: '6px' }}>
            Phone number
            <input type="tel" value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} />
          </label>
          <button type="submit" disabled={savingProfile || !user?.id} style={{ alignSelf: 'end', minHeight: '42px', padding: '0 14px' }}>
            {savingProfile ? 'Saving...' : 'Save details'}
          </button>
        </form>
      </section>

      {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#356b58' }}>{message}</p>}

      <div role="tablist" aria-label="Appointment history" style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past / Cancelled' },
        ].map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 14px',
              color: activeTab === tab.id ? '#fff' : '#4b5851',
              borderColor: activeTab === tab.id ? '#356b58' : '#e4e9e5',
              background: activeTab === tab.id ? '#356b58' : '#fff',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading appointments...</p>
      ) : visibleBookings.length === 0 ? (
        <p>{activeTab === 'upcoming' ? 'You have no upcoming appointments.' : 'You have no past or cancelled appointments.'}</p>
      ) : (
        visibleBookings.map((booking) => (
          <article key={booking.id} style={{ border: '1px solid #e4e9e5', padding: '16px', marginBottom: '12px', borderRadius: '10px', background: '#fff' }}>
            <strong>{booking.providers?.name}</strong> ({booking.providers?.category})
            <p style={{ margin: '10px 0' }}>
              {booking.appointment_date} at {booking.appointment_time?.slice(0, 5)} — Status: <strong>{booking.status}</strong>
            </p>
            {activeTab === 'upcoming' && booking.status !== 'completed' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {booking.status === 'pending' && (
                  <button type="button" onClick={() => cancelBooking(booking.id)} style={{ padding: '7px 12px', cursor: 'pointer' }}>
                    Cancel appointment
                  </button>
                )}
                {['pending', 'confirmed'].includes(booking.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setRescheduleDate('');
                      setSlots([]);
                      setSelectedTime('');
                      setActiveRescheduleId(activeRescheduleId === booking.id ? null : booking.id);
                    }}
                    style={{ padding: '7px 12px', cursor: 'pointer' }}
                  >
                    {activeRescheduleId === booking.id ? 'Close rescheduling' : 'Reschedule'}
                  </button>
                )}
              </div>
            )}
            {activeRescheduleId === booking.id && (
              <form onSubmit={(event) => saveReschedule(event, booking)} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  New date
                  <input
                    type="date"
                    value={rescheduleDate}
                    min={today}
                    onChange={(event) => {
                      setSlots([]);
                      setSelectedTime('');
                      setRescheduleDate(event.target.value);
                    }}
                    required
                  />
                </label>
                {rescheduleDate && (
                  <fieldset style={{ border: 0, padding: 0 }}>
                    <legend style={{ marginBottom: '8px' }}>Available time</legend>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          aria-pressed={selectedTime === slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          style={{
                            padding: '7px 11px',
                            color: selectedTime === slot.time ? '#fff' : '#4b5851',
                            background: selectedTime === slot.time ? '#356b58' : '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {slot.time}
                        </button>
                      ))}
                      {availableSlots.length === 0 && <span>No available times for this date.</span>}
                    </div>
                  </fieldset>
                )}
                <button type="submit" disabled={!selectedTime || savingReschedule} style={{ justifySelf: 'start', minHeight: '40px', padding: '0 14px' }}>
                  {savingReschedule ? 'Rescheduling...' : 'Confirm new time'}
                </button>
              </form>
            )}
          </article>
        ))
      )}
    </main>
  );
}

export default MyBookings;
