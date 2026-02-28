/**
 * Bio-Clinic Admin Setup — One-time Bootstrap Endpoint
 * =====================================================
 * Creates or confirms the admin user in Supabase Auth and 
 * inserts the corresponding row in the public.users table.
 * 
 * Uses SUPABASE_SERVICE_KEY from Cloudflare environment secrets.
 * This endpoint is protected by a one-time setup token.
 * 
 * SECURITY: Remove this file after initial setup is complete.
 * 
 * @version 1.0.0
 * @date 2026-02-28
 */

const SETUP_TOKEN = 'bio-clinic-setup-2026-02-28';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Validate setup token
    const body = await request.json().catch(() => ({}));
    if (body.token !== SETUP_TOKEN) {
      return jsonRes({ error: 'Invalid setup token' }, 403);
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return jsonRes({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment' }, 500);
    }

    const email = body.email || 'admin@bio-clinic.it';
    const password = body.password || 'BioClinic2026!Admin';
    const results = { steps: [] };

    // Step 1: List existing auth users
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const listData = await listRes.json();
    const existingUsers = listData.users || [];
    results.steps.push({ step: 'list_users', count: existingUsers.length });

    // Step 2: Find or create admin auth user
    let authUser = existingUsers.find(u => u.email === email);
    
    if (authUser) {
      // User exists - update to confirm email and set password
      results.steps.push({ step: 'user_found', id: authUser.id, confirmed: !!authUser.email_confirmed_at });
      
      const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUser.id}`, {
        method: 'PUT',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: 'super_admin', name: 'Amministratore' },
        }),
      });
      const updateData = await updateRes.json();
      authUser = updateData;
      results.steps.push({ step: 'user_updated', confirmed: !!updateData.email_confirmed_at, status: updateRes.status });
    } else {
      // Create new user with auto-confirm
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: 'super_admin', name: 'Amministratore' },
        }),
      });
      authUser = await createRes.json();
      results.steps.push({ step: 'user_created', id: authUser.id, status: createRes.status });
    }

    if (!authUser || !authUser.id) {
      return jsonRes({ error: 'Failed to create/update auth user', details: authUser }, 500);
    }

    // Step 3: Insert user in public.users table
    const userRow = {
      id: authUser.id,
      auth_id: authUser.id,
      email: email,
      first_name: 'Admin',
      last_name: 'Bio-Clinic',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Try upsert (insert or update)
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(userRow),
    });
    const insertData = await insertRes.json();
    results.steps.push({ step: 'users_table_upsert', status: insertRes.status, data: insertData });

    // Step 4: Verify login works
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY || SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    results.steps.push({ 
      step: 'login_test', 
      success: loginRes.ok, 
      status: loginRes.status,
      has_token: !!loginData.access_token,
    });

    results.success = true;
    results.message = `Admin user ${email} is ready. Login should work now.`;
    results.credentials = { email, password_hint: password.substring(0, 3) + '***' };

    return jsonRes(results);
  } catch (err) {
    return jsonRes({ error: err.message, stack: err.stack }, 500);
  }
}

export async function onRequestGet() {
  return jsonRes({
    endpoint: '/api/admin/setup',
    method: 'POST',
    body: { token: 'required', email: 'optional', password: 'optional' },
    description: 'One-time admin setup endpoint. Remove after use.',
  });
}
