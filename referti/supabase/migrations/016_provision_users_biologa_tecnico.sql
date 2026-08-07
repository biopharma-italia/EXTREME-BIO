-- ============================================================================
-- 016: Provisioning utenti — Biologa Laboratorio + Tecnico Laboratorio
-- Date: 2026-08-07
-- ============================================================================
-- NOTA: Questo script NON crea gli utenti in auth.users.
-- Gli utenti devono essere creati prima via Supabase Auth Admin API
-- (vedi lo script companion 016_provision_auth_users.sh).
-- Questo script crea i profili in public.users assumendo che il trigger
-- handle_new_user() li abbia già creati con role='patient' e li aggiorna
-- al ruolo corretto.
--
-- ALTERNATIVA: Se gli utenti vengono creati con user_metadata.role corretto
-- via Admin API, il trigger li crea direttamente con il ruolo giusto.
-- In quel caso questo script serve solo come verifica/fix.
-- ============================================================================

-- ── 1. Cinzia Guarino — Biologa Laboratorio ────────────────────────────────
-- Email: cinzia.guarino@bio-clinic.it (da confermare)
-- Se l'utente è già stato creato via Auth API con role metadata, questo UPDATE
-- è un no-op o un safety net.

UPDATE public.users
SET role = 'biologa_laboratorio'::user_role,
    updated_at = NOW()
WHERE email = 'cinzia.guarino@bio-clinic.it'
  AND role != 'biologa_laboratorio';

-- ── 2. Sara Meloni — Biologa Laboratorio ────────────────────────────────────
-- Email: sara.meloni@bio-clinic.it (da confermare)

UPDATE public.users
SET role = 'biologa_laboratorio'::user_role,
    updated_at = NOW()
WHERE email = 'sara.meloni@bio-clinic.it'
  AND role != 'biologa_laboratorio';

-- ── 3. Gabriele Delogu — Tecnico di Laboratorio ────────────────────────────
-- Email: gabriele.delogu@bio-clinic.it (da confermare)

UPDATE public.users
SET role = 'tecnico_laboratorio'::user_role,
    updated_at = NOW()
WHERE email = 'gabriele.delogu@bio-clinic.it'
  AND role != 'tecnico_laboratorio';


-- ── Verifica ────────────────────────────────────────────────────────────────
-- SELECT id, email, first_name, last_name, role, is_active
-- FROM public.users
-- WHERE role IN ('biologa_laboratorio', 'tecnico_laboratorio')
-- ORDER BY last_name;
