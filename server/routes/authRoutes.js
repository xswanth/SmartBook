const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'customer' } = req.body;
  console.log(`📩 [REGISTER ATTEMPT] Email: ${email} | Role: ${role}`);

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // 1. Create confirmed user via Admin API (zero emails sent, no rate limit)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('❌ [AUTH CREATE ERROR]:', authError.message);
    return res.status(400).json({ error: authError.message });
  }

  // 2. Insert user details and role into public.profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: authData.user.id, name, email, role }])
    .select()
    .single();

  if (profileError) {
    console.error('❌ [PROFILE INSERT ERROR]:', profileError.message);
    return res.status(500).json({ error: profileError.message });
  }

  console.log(`🎉 [REGISTER SUCCESS] Created user ${email} (ID: ${authData.user.id})`);
  return res.status(201).json({
    message: 'Registration successful',
    user: authData.user,
    profile: profileData,
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔑 [LOGIN ATTEMPT] Email: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`❌ [LOGIN FAILED] ${email}:`, error.message);
    return res.status(401).json({ error: error.message });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  console.log(`🎉 [LOGIN SUCCESS] ${email} logged in as [${profile?.role || 'customer'}]`);
  return res.status(200).json({
    message: 'Login successful',
    user: data.user,
    profile: profile || { name: data.user.email, role: 'customer' },
    session: data.session,
  });
});

module.exports = router;