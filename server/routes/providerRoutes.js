const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/providers - Fetch all approved providers (with optional category & search filter)
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  let query = supabase
    .from('providers')
    .select('*')
    .eq('is_approved', true);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/providers/:id - Fetch single provider details
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Provider not found' });
  res.json(data);
});

// PUT /api/providers/:id - Update provider schedule/details (Member 5)
router.put('/:id', async (req, res) => {
  const { working_days, start_time, end_time, slot_duration, description, location } = req.body;

  const { data, error } = await supabase
    .from('providers')
    .update({ working_days, start_time, end_time, slot_duration, description, location })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;