const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    name,
    email,
    phone = '',
    password,
    role = 'customer',
    business_name,
    category,
    location,
    description,
    working_days,
    start_time,
    end_time,
    slot_duration,
  } = req.body;

  console.log(`📩 [REGISTER ATTEMPT] Email: ${email} | Role: ${role}`);

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // 1. Create confirmed user in Supabase Auth (bypasses email rate limits)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('❌ [AUTH CREATE ERROR]:', authError.message);
    return res.status(400).json({ error: authError.message });
  }

  // 2. Insert into public.profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: authData.user.id,
        name,
        email,
        phone,
        role,
      },
    ])
    .select()
    .single();

  if (profileError) {
    console.error('❌ [PROFILE INSERT ERROR]:', profileError.message);
    return res.status(500).json({ error: profileError.message });
  }

  // 3. If role is 'provider', insert linked row into public.providers
  if (role === 'provider') {
    const { error: providerError } = await supabase
      .from('providers')
      .insert([
        {
          user_id: authData.user.id,
          name: business_name || name,
          category: category || 'other',
          location: location || '',
          description: description || '',
          working_days: working_days || 'Mon,Tue,Wed,Thu,Fri',
          start_time: start_time || '09:00:00',
          end_time: end_time || '17:00:00',
          slot_duration: Number(slot_duration) || 30,
          is_approved: false,
        },
      ]);

    if (providerError) {
      console.error('❌ [PROVIDER INSERT ERROR]:', providerError.message);
      return res.status(500).json({ error: providerError.message });
    }
  }

  console.log(`🎉 [REGISTER SUCCESS] Created ${role}: ${email} (ID: ${authData.user.id})`);
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

  // 1. Verify credentials with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`❌ [LOGIN FAILED] ${email}:`, error.message);
    return res.status(401).json({ error: error.message });
  }

  // 2. Fetch profile (name, phone, role)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.warn(`⚠️ [PROFILE FETCH WARNING] ${email}:`, profileError.message);
  }

  // 3. If provider, also fetch their provider record
  let providerInfo = null;
  if (profile?.role === 'provider') {
    const { data: providerData } = await supabase
      .from('providers')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    providerInfo = providerData;
  }

  console.log(`🎉 [LOGIN SUCCESS] ${email} logged in as [${profile?.role || 'customer'}]`);
  return res.status(200).json({
    message: 'Login successful',
    user: data.user,
    profile: profile || { name: data.user.email, role: 'customer' },
    provider: providerInfo,
    session: data.session,
  });
});

module.exports = router;