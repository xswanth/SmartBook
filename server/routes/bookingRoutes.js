const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/bookings/slots?provider_id=...&date=YYYY-MM-DD (Member 3)
router.get('/slots', async (req, res) => {
  const { provider_id, date } = req.query;
  if (!provider_id || !date) {
    return res.status(400).json({ error: 'provider_id and date are required' });
  }

  // 1. Get provider schedule
  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('start_time, end_time, slot_duration, working_days')
    .eq('id', provider_id)
    .single();

  if (provErr || !provider) return res.status(404).json({ error: 'Provider not found' });

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