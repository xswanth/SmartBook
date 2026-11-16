const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/admin/stats - Overview counts
router.get('/stats', async (req, res) => {
  const [{ count: users }, { count: providers }, { count: appointments }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('providers').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
  ]);

  res.json({ users: users || 0, providers: providers || 0, appointments: appointments || 0 });
});

// GET /api/admin/providers - All providers (approved + pending)
router.get('/providers', async (req, res) => {
  const { data, error } = await supabase
    .from('providers')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/providers/:id/approve - Approve or block provider
router.patch('/providers/:id/approve', async (req, res) => {
  const { is_approved } = req.body;

  const { data, error } = await supabase
    .from('providers')
    .update({ is_approved })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;