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
      const msg = usersError?.message || providersError?.message || appointmentsError?.message;
      console.error('❌ [ADMIN STATS ERROR]:', msg);
      return res.status(500).json({ error: msg });
    }

    res.json({
      users: users || 0,
      providers: providers || 0,
      appointments: appointments || 0,
    });
  } catch (error) {
    console.error('❌ [ADMIN STATS EXCEPTION]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/providers - All providers (pending + approved)
router.get('/providers', async (req, res) => {
  try {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ADMIN PROVIDERS ERROR]:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const userIds = [...new Set((providers || []).map((p) => p.user_id).filter(Boolean))];
    let profiles = [];

    if (userIds.length > 0) {
      const { data, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ [ADMIN PROVIDER PROFILES ERROR]:', profilesError.message);
        return res.status(500).json({ error: profilesError.message });
      }
      profiles = data || [];
    }

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    res.json(
      (providers || []).map((provider) => ({
        ...provider,
        profiles: profilesById.get(provider.user_id) || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/bookings - All bookings
router.get('/bookings', async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ADMIN BOOKINGS ERROR]:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const userIds = [...new Set((bookings || []).map((b) => b.user_id).filter(Boolean))];
    const providerIds = [...new Set((bookings || []).map((b) => b.provider_id).filter(Boolean))];

    const [profilesResult, providersResult] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, name').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      providerIds.length > 0
        ? supabase.from('providers').select('id, name, category').in('id', providerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error || providersResult.error) {
      const msg = profilesResult.error?.message || providersResult.error?.message;
      console.error('❌ [ADMIN BOOKINGS JOIN ERROR]:', msg);
      return res.status(500).json({ error: msg });
    }

    const profilesById = new Map((profilesResult.data || []).map((p) => [p.id, p]));
    const providersById = new Map((providersResult.data || []).map((p) => [p.id, p]));

    res.json(
      (bookings || []).map((booking) => ({
        ...booking,
        profiles: profilesById.get(booking.user_id) || null,
        providers: providersById.get(booking.provider_id) || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users - All registered users with roles
router.get('/users', async (req, res) => {
  try {
    // Fixed: profiles table has no created_at column, order by name instead
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [ADMIN USERS ERROR]:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/providers/:id/approve - Approve or suspend provider
router.patch('/providers/:id/approve', async (req, res) => {
  try {
    const { is_approved } = req.body;

    if (typeof is_approved !== 'boolean') {
      return res.status(400).json({ error: 'is_approved must be true or false' });
    }

    const { data, error } = await supabase
      .from('providers')
      .update({ is_approved })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [ADMIN APPROVE ERROR]:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;