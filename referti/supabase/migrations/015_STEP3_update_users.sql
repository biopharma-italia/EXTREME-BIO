-- ============================================================================
-- STEP 3 di 3 — Eseguire DOPO lo STEP 2
-- ============================================================================
-- Assegna i ruoli corretti ai 3 utenti
-- ============================================================================

UPDATE public.users SET role = 'biologa_laboratorio', updated_at = NOW() WHERE email = 'cinzia.guarino@bio-clinic.it';
UPDATE public.users SET role = 'biologa_laboratorio', updated_at = NOW() WHERE email = 'sara.meloni@bio-clinic.it';
UPDATE public.users SET role = 'tecnico_laboratorio', updated_at = NOW() WHERE email = 'gabriele.delogu@bio-clinic.it';

-- Verifica:
SELECT id, email, first_name, last_name, role, is_active FROM public.users
WHERE email IN ('cinzia.guarino@bio-clinic.it','sara.meloni@bio-clinic.it','gabriele.delogu@bio-clinic.it')
ORDER BY last_name;
