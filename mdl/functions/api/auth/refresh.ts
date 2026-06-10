/**
 * POST /api/auth/refresh — Refresh access token
 */
export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as { refresh_token?: string };
    if (!body.refresh_token) {
      return Response.json({ success: false, error: 'Refresh token mancante' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: body.refresh_token });
    if (error || !data.session) {
      return Response.json({ success: false, error: 'Sessione scaduta. Effettua nuovamente il login.' }, { status: 401 });
    }

    return Response.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  } catch {
    return Response.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
};
