
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/admin/stats - Overview counts
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: users, error: usersError },
      { count: providers, error: providersError },
      { count: appointments, error: appointmentsError },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('providers').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
    ]);

    if (usersError || providersError || appointmentsError) {
      throw new Error(
        usersError?.message ||
        providersError?.message ||
        appointmentsError?.message
      );
    }

    res.json({
      users: users || 0,
      providers: providers || 0,
      appointments: appointments || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/admin/providers - All providers
router.get('/providers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/admin/bookings - All bookings
router.get('/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles(name), providers(name)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/admin/users - All registered users with roles
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// PATCH /api/admin/providers/:id/approve
// Approve or suspend provider
router.patch('/providers/:id/approve', async (req, res) => {
  try {
    const { is_approved } = req.body;

    if (typeof is_approved !== 'boolean') {
      return res.status(400).json({
        error: 'is_approved must be true or false',
      });
    }

    const { data, error } = await supabase
      .from('providers')
      .update({ is_approved })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
