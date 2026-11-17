
import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const STATUS_STYLES = {
  pending: { background: '#fef3c7', color: '#92400e' },
  confirmed: { background: '#dbeafe', color: '#1e40af' },
  completed: { background: '#dcfce7', color: '#166534' },
  cancelled: { background: '#fee2e2', color: '#991b1b' },
};

const NEXT_ACTIONS = {
  pending: [
    { status: 'confirmed', label: 'Confirm appointment' },
    { status: 'cancelled', label: 'Cancel appointment' },
  ],
  confirmed: [
    { status: 'completed', label: 'Mark completed' },
    { status: 'cancelled', label: 'Cancel appointment' },
  ],
  completed: [],
  cancelled: [],
};

const FILTERS = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

const buttonStyle = {
  padding: '9px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  boxSizing: 'border-box',
  fontSize: '14px',
};

function readProvider() {
  try {
    return JSON.parse(
      localStorage.getItem('smartbook_provider') || 'null'
    );
  } catch {
    return null;
  }
}

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

async function readResponse(response, fallback) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    // The server may return an empty or non-JSON response.
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {
    background: '#f1f5f9',
    color: '#334155',
  };

  return (
    <span
      style={{
        ...style,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {status || 'Unknown'}
    </span>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        flex: '1 1 150px',
        padding: '18px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#fff',
      }}
    >
      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
        {title}
      </p>

      <h2
        style={{
          margin: '10px 0 0',
          color: color || '#0f172a',
          fontSize: '28px',
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function ProviderDashboard() {
  const [provider, setProvider] = useState(readProvider);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [savingHours, setSavingHours] = useState(false);
  const [hoursError, setHoursError] = useState('');
  const [hoursSuccess, setHoursSuccess] = useState('');

  const [workingDays, setWorkingDays] = useState(
    Array.isArray(provider?.working_days)
      ? provider.working_days
      : []
  );

  const [startTime, setStartTime] = useState(
    provider?.start_time || '09:00'
  );

  const [endTime, setEndTime] = useState(
    provider?.end_time || '18:00'
  );

  const [slotDuration, setSlotDuration] = useState(
    String(provider?.slot_duration || 30)
  );

  // Fetch provider appointments.
  const fetchAppointments = useCallback(
    async (signal) => {
      if (!provider?.id) {
        setAppointments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError('');

        const response = await fetch(
          `${API_BASE}/bookings/provider/${encodeURIComponent(provider.id)}`,
          { signal }
        );

        const data = await readResponse(
          response,
          'Unable to load appointments.'
        );

        if (!Array.isArray(data)) {
          throw new Error(
            'The bookings API did not return an appointment array.'
          );
        }

        setAppointments(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Server connection failed.');
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [provider?.id]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchAppointments(controller.signal);

    return () => controller.abort();
  }, [fetchAppointments]);

  // Refresh appointments.
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Update appointment status.
  const updateStatus = async (appointmentId, status) => {
    if (busyId !== null) return;

    if (
      status === 'cancelled' &&
      !window.confirm('Are you sure you want to cancel this appointment?')
    ) {
      return;
    }

    setBusyId(appointmentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE}/bookings/${encodeURIComponent(appointmentId)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      await readResponse(response, 'Failed to update appointment.');

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );

      setSuccess(`Appointment ${status} successfully.`);
    } catch (err) {
      setError(err.message || 'Could not update appointment.');
    } finally {
      setBusyId(null);
    }
  };

  // Appointment statistics.
  const counts = useMemo(() => {
    const result = {
      all: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    appointments.forEach((appointment) => {
      if (Object.prototype.hasOwnProperty.call(
        result,
        appointment.status
      )) {
        result[appointment.status] += 1;
      }
    });

    return result;
  }, [appointments]);

  // Search, filter and sort appointments.
  const filteredAppointments = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return appointments
      .filter((appointment) => {
        const customer = appointment.profiles || {};

        const name = String(customer.name || '').toLowerCase();
        const phone = String(customer.phone || '').toLowerCase();
        const email = String(customer.email || '').toLowerCase();

        const matchesSearch =
          !searchText ||
          name.includes(searchText) ||
          phone.includes(searchText) ||
          email.includes(searchText);

        const matchesStatus =
          filter === 'all' || appointment.status === filter;

        const matchesDate =
          !selectedDate ||
          appointment.appointment_date === selectedDate;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const first = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
        const second = `${b.appointment_date || ''} ${b.appointment_time || ''}`;

        return first.localeCompare(second);
      });
  }, [appointments, filter, search, selectedDate]);

  // Update selected working days.
  const toggleWorkingDay = (day) => {
    setWorkingDays((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day]
    );
  };

  // Save working hours using your existing PUT API.
  const saveWorkingHours = async (event) => {
    event.preventDefault();

    if (!provider?.id) {
      setHoursError('Provider profile not found. Please log in again.');
      return;
    }

    if (workingDays.length === 0) {
      setHoursError('Please select at least one working day.');
      return;
    }

    if (startTime >= endTime) {
      setHoursError('Closing time must be later than opening time.');
      return;
    }

    const duration = Number(slotDuration);

    if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
      setHoursError('Slot duration must be between 5 and 480 minutes.');
      return;
    }

    setSavingHours(true);
    setHoursError('');
    setHoursSuccess('');

    try {
      const response = await fetch(
        `${API_BASE}/providers/${encodeURIComponent(provider.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            working_days: workingDays,
            start_time: startTime,
            end_time: endTime,
            slot_duration: duration,
          }),
        }
      );

      const data = await readResponse(
        response,
        'Unable to save working hours.'
      );

      // Support either { provider: {...} } or { ...providerFields }.
      const updatedProvider = data.provider || data;

      const nextProvider = {
        ...provider,
        ...updatedProvider,
        working_days: workingDays,
        start_time: startTime,
        end_time: endTime,
        slot_duration: duration,
      };

      setProvider(nextProvider);
      localStorage.setItem(
        'smartbook_provider',
        JSON.stringify(nextProvider)
      );

      setHoursSuccess('Working hours saved successfully.');
    } catch (err) {
      setHoursError(err.message || 'Could not save working hours.');
    } finally {
      setSavingHours(false);
    }
  };

  if (!provider?.id) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <h2>Provider profile not found</h2>
        <p>Please log in again to access your dashboard.</p>
      </div>
    );
  }

  const sectionStyle = {
    marginTop: '28px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    background: '#fff',
  };

  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '30px auto',
        padding: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a',
      }}
    >
      {/* Dashboard header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '26px' }}>
            Welcome, {provider.name || 'Provider'}
          </h1>

          <p style={{ margin: 0, color: '#64748b' }}>
            Manage your appointments and working schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{
            ...buttonStyle,
            background: '#1e293b',
            color: '#fff',
          }}
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </header>

      {/* Approval notice */}
      {provider.is_approved === false && (
        <div
          style={{
            padding: '14px',
            marginBottom: '20px',
            borderRadius: '9px',
            background: '#fef3c7',
            color: '#92400e',
          }}
        >
          Your provider listing is waiting for admin approval.
        </div>
      )}

      {/* Error and success messages */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '8px',
            background: '#dcfce7',
            color: '#166534',
          }}
        >
          {success}
        </div>
      )}

      {/* Statistics */}
      <section>
        <h2 style={{ fontSize: '19px' }}>Appointment Overview</h2>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <StatCard title="Total appointments" value={counts.all} />
          <StatCard title="Pending" value={counts.pending} color="#b45309" />
          <StatCard title="Confirmed" value={counts.confirmed} color="#1d4ed8" />
          <StatCard title="Completed" value={counts.completed} color="#15803d" />
          <StatCard title="Cancelled" value={counts.cancelled} color="#b91c1c" />
        </div>
      </section>

      {/* Appointments */}
      <section style={sectionStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Incoming Appointments
          </h2>

          <span style={{ color: '#64748b', fontSize: '14px' }}>
            Showing {filteredAppointments.length} of {appointments.length}
          </span>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by customer name, phone or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ ...inputStyle, marginTop: '18px' }}
        />

        {/* Date filter */}
        <div style={{ marginTop: '12px' }}>
          <label
            htmlFor="appointment-date"
            style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}
          >
            Filter by appointment date
          </label>

          <input
            id="appointment-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            style={{ ...inputStyle, maxWidth: '260px' }}
          />

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              style={{ ...buttonStyle, marginLeft: '8px' }}
            >
              Clear date
            </button>
          )}
        </div>

        {/* Status filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            margin: '18px 0',
          }}
        >
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              style={{
                ...buttonStyle,
                borderColor: filter === item ? '#1e293b' : '#cbd5e1',
                background: filter === item ? '#1e293b' : '#fff',
                color: filter === item ? '#fff' : '#334155',
                textTransform: 'capitalize',
              }}
            >
              {item} ({counts[item]})
            </button>
          ))}
        </div>

        {/* Appointment list */}
        {loading ? (
          <p style={{ padding: '25px', textAlign: 'center' }}>
            Loading appointments...
          </p>
        ) : filteredAppointments.length === 0 ? (
          <div
            style={{
              padding: '35px 15px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '12px',
            }}
          >
            <h3>No appointments found</h3>
            <p style={{ color: '#64748b' }}>
              Try changing your search or filters. New appointments will
              appear here.
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => {
            const customer = appointment.profiles || {};
            const actions = NEXT_ACTIONS[appointment.status] || [];
            const isBusy = busyId === appointment.id;

            return (
              <article
                key={appointment.id}
                style={{
                  padding: '18px',
                  marginBottom: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>
                      {customer.name || 'Unknown Customer'}
                    </h3>

                    <p style={{ margin: '7px 0', color: '#475569' }}>
                      📞 {customer.phone || 'Phone not available'}
                    </p>

                    <p style={{ margin: '7px 0', color: '#475569' }}>
                      ✉️ {customer.email || 'Email not available'}
                    </p>
                  </div>

                  <StatusBadge status={appointment.status} />
                </div>

                <hr
                  style={{
                    border: 0,
                    borderTop: '1px solid #e2e8f0',
                    margin: '16px 0',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    color: '#334155',
                  }}
                >
                  <span>
                    <strong>Date:</strong>{' '}
                    {appointment.appointment_date || 'Not available'}
                  </span>

                  <span>
                    <strong>Time:</strong>{' '}
                    {appointment.appointment_time || 'Not available'}
                  </span>
                </div>

                {actions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '9px',
                      marginTop: '18px',
                    }}
                  >
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        disabled={busyId !== null}
                        onClick={() =>
                          updateStatus(appointment.id, action.status)
                        }
                        style={{
                          ...buttonStyle,
                          background:
                            action.status === 'cancelled'
                              ? '#fff'
                              : '#1e293b',
                          color:
                            action.status === 'cancelled'
                              ? '#b91c1c'
                              : '#fff',
                          opacity: busyId !== null ? 0.6 : 1,
                          cursor: busyId !== null ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isBusy ? 'Saving...' : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* Working hours */}
      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0, fontSize: '20px' }}>
          Working Hours Management
        </h2>

        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Select your available days, opening time, closing time and
          appointment slot duration.
        </p>

        {hoursError && (
          <p role="alert" style={{ color: '#dc2626' }}>
            {hoursError}
          </p>
        )}

        {hoursSuccess && (
          <p role="status" style={{ color: '#15803d' }}>
            {hoursSuccess}
          </p>
        )}

        <form onSubmit={saveWorkingHours}>
          <h3 style={{ fontSize: '15px' }}>Available days</h3>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {DAYS.map((day) => (
              <label
                key={day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={workingDays.includes(day)}
                  onChange={() => toggleWorkingDay(day)}
                />
                {day}
              </label>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '15px',
            }}
          >
            <label>
              <span style={{ display: 'block', marginBottom: '7px' }}>
                Opening time
              </span>

              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                style={inputStyle}
                required
              />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '7px' }}>
                Closing time
              </span>

              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                style={inputStyle}
                required
              />
            </label>

            <label>
              <span style={{ display: 'block', marginBottom: '7px' }}>
                Slot duration (minutes)
              </span>

              <input
                type="number"
                min="5"
                max="480"
                step="5"
                value={slotDuration}
                onChange={(event) => setSlotDuration(event.target.value)}
                style={inputStyle}
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingHours}
            style={{
              ...buttonStyle,
              marginTop: '20px',
              background: '#1e293b',
              color: '#fff',
              opacity: savingHours ? 0.6 : 1,
            }}
          >
            {savingHours ? 'Saving...' : 'Save Working Hours'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ProviderDashboard;
