const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Helper: Check if a YYYY-MM-DD date falls on one of the provider's working_days
const checkWorkingDay = (dateString, workingDays) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [year, month, day] = dateString.split('-').map(Number);
  const dayName = days[new Date(year, month - 1, day).getDay()];

  // Support both comma-separated string ("Mon,Tue,Wed") and array (["Mon", "Tue"])
  const daysList = Array.isArray(workingDays)
    ? workingDays
    : typeof workingDays === 'string' && workingDays.trim() !== ''
    ? workingDays.split(',').map((d) => d.trim())
    : [];

  if (daysList.length === 0) {
    return { isWorkingDay: true, dayName };
  }

  const isWorkingDay = daysList.some(
    (d) => d.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3))
  );

  return { isWorkingDay, dayName };
};

// GET /api/bookings/slots?provider_id=...&date=YYYY-MM-DD (Member 3)
router.get('/slots', async (req, res) => {
  const { provider_id, date } = req.query;
  if (!provider_id || !date) {
    return res.status(400).json({ error: 'provider_id and date are required' });
  }

  // Block past dates
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.json([]);
  }

  // 1. Get provider schedule
  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('start_time, end_time, slot_duration, working_days')
    .eq('id', provider_id)
    .single();

  if (provErr || !provider) return res.status(404).json({ error: 'Provider not found' });

  // Check if selected date is in provider's working_days
  const { isWorkingDay } = checkWorkingDay(date, provider.working_days);
  if (!isWorkingDay) {
    return res.json([]);
  }

  // 2. Get already booked times for that date
  const { data: booked } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('provider_id', provider_id)
    .eq('appointment_date', date)
    .neq('status', 'cancelled');

  const bookedTimes = (booked || []).map((b) => b.appointment_time.slice(0, 5));

  // 3. Generate available time slots
  const slots = [];
  const [startH, startM] = provider.start_time.split(':').map(Number);
  const [endH, endM] = provider.end_time.split(':').map(Number);
  let currentMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  while (currentMins + provider.slot_duration <= endMins) {
    const hh = String(Math.floor(currentMins / 60)).padStart(2, '0');
    const mm = String(currentMins % 60).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    slots.push({
      time: timeStr,
      isBooked: bookedTimes.includes(timeStr),
    });
    currentMins += provider.slot_duration;
  }

  res.json(slots);
});

// POST /api/bookings - Create a new appointment (Member 3)
router.post('/', async (req, res) => {
  const { user_id, provider_id, appointment_date, appointment_time, notes = '' } = req.body;

  // Block past dates
  const today = new Date().toISOString().split('T')[0];
  if (appointment_date < today) {
    return res.status(400).json({ error: 'Cannot book appointments in the past.' });
  }

  // Verify provider exists and works on the selected day
  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('working_days')
    .eq('id', provider_id)
    .single();

  if (provErr || !provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const { isWorkingDay, dayName } = checkWorkingDay(appointment_date, provider.working_days);
  if (!isWorkingDay) {
    return res.status(400).json({ error: `Provider does not work on ${dayName}s.` });
  }

  // Prevent double booking
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('provider_id', provider_id)
    .eq('appointment_date', appointment_date)
    .eq('appointment_time', appointment_time)
    .neq('status', 'cancelled');

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'This time slot is already booked.' });
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([{ user_id, provider_id, appointment_date, appointment_time, notes, status: 'pending' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/bookings/user/:userId - Customer's own bookings (Member 4)
router.get('/user/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, providers(name, category, location)')
    .eq('user_id', req.params.userId)
    .order('appointment_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/bookings/user/:userId - Update customer's name and phone
router.patch('/user/:userId', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const { data, error } = await supabase
    .from('profiles')
    .update({ name, phone })
    .eq('id', req.params.userId)
    .select('id, name, phone')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/bookings/provider/:providerId - Provider's incoming bookings (Member 5)
router.get('/provider/:providerId', async (req, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, profiles(name, email, phone)')
    .eq('provider_id', req.params.providerId)
    .order('appointment_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/bookings/:id/reschedule - Change an appointment's date and time
router.patch('/:id/reschedule', async (req, res) => {
  const { appointment_date, appointment_time } = req.body;

  if (
    typeof appointment_date !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)
    || typeof appointment_time !== 'string'
    || !/^\d{2}:\d{2}(:\d{2})?$/.test(appointment_time)
  ) {
    return res.status(400).json({ error: 'A valid appointment_date and appointment_time are required' });
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, status, provider_id')
    .eq('id', req.params.id)
    .single();

  if (appointmentError) return res.status(404).json({ error: 'Appointment not found' });
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    return res.status(409).json({ error: 'Only pending or confirmed appointments can be rescheduled' });
  }

  const { data: existing, error: existingError } = await supabase
    .from('appointments')
    .select('id')
    .eq('provider_id', appointment.provider_id)
    .eq('appointment_date', appointment_date)
    .eq('appointment_time', appointment_time)
    .neq('status', 'cancelled')
    .neq('id', appointment.id);

  if (existingError) return res.status(500).json({ error: existingError.message });
  if (existing?.length) {
    return res.status(409).json({ error: 'This time slot is already booked.' });
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ appointment_date, appointment_time })
    .eq('id', appointment.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/bookings/:id/status - Confirm, complete, or cancel booking (Member 4 & Member 5)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body; // 'confirmed' | 'cancelled' | 'completed'

  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;