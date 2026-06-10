/**
 * POST /api/auth/login
 * Authenticate user and return session token
 */
export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  const { supabaseAdmin, env, ip, userAgent } = ctx;

  try {
    const body = await context.request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email e password sono obbligatori' }, { status: 400 });
    }

    // Authenticate via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      // Log failed attempt
      await supabaseAdmin.from('mdl_audit_log').insert({
        action: 'login_failed',
        ip_address: ip,
        user_agent: userAgent,
        details: { email, reason: error.message },
        risk_level: 'medium',
      });

      return Response.json({ success: false, error: 'Credenziali non valide' }, { status: 401 });
    }

    // Get MDL user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('mdl_users')
      .select('*')
      .eq('auth_id', data.user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      return Response.json(
        { success: false, error: 'Account non abilitato per Medicina del Lavoro' },
        { status: 403 }
      );
    }

    // Update login stats
    await supabaseAdmin
      .from('mdl_users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (profile.login_count || 0) + 1,
      })
      .eq('id', profile.id);

    // Audit log
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: profile.id,
      user_role: profile.role,
      action: 'login',
      ip_address: ip,
      user_agent: userAgent,
      details: { method: 'password' },
    });

    return Response.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
      user: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        company_id: profile.company_id,
      },
    });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
};
