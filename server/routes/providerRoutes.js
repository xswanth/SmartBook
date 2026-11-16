
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET all approved providers with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, location } = req.query;

    let query = supabase
      .from('providers')
      .select('*')
      .eq('is_approved', true);

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Search by provider name
    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    // Filter by location
    if (location && location.trim()) {
      query = query.ilike('location', `%${location.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Provider fetch error:', error.message);
      return res.status(500).json({
        error: 'Failed to fetch providers'
      });
    }

    return res.status(200).json(data || []);

  } catch (error) {
    console.error('Server error:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});


// GET individual provider details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_approved', true)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Provider not found'
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Provider details error:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});


// Preserve Member 5's existing PUT /:id route below.
// Do not remove or modify another member's implementation.

module.exports = router;
