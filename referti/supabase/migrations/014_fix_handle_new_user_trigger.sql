-- ============================================================================
-- 014: Fix handle_new_user() trigger — safe handling of non-Referti roles
-- ============================================================================
-- PROBLEM: The trigger (from migration 006) casts user_metadata.role to the
-- Referti `user_role` enum. When MDL creates users with roles like
-- 'medico_competente', 'segreteria_mdl', etc., the cast fails with
-- "Database error saving new user" because those roles are not in
-- the Referti enum.
--
-- FIX: Wrap the role cast in a CASE expression that checks whether the
-- incoming role is a valid Referti enum value. If not, default to 'patient'.
-- This allows both Referti and MDL user creation to coexist.
--
-- CURRENT WORKAROUND: MDL passes role='patient' in user_metadata and stores
-- the real role only in mdl_users. This migration removes the need for
-- that workaround, though it remains backwards-compatible.
-- ============================================================================

-- Replace the function with a safe version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_role TEXT;
  _safe_role user_role;
BEGIN
  -- Extract the raw role string from user metadata
  _raw_role := NEW.raw_user_meta_data->>'role';

  -- Safely cast to user_role enum: if the value is not a valid Referti
  -- enum member, default to 'patient'. This handles MDL roles gracefully.
  BEGIN
    IF _raw_role IS NOT NULL AND _raw_role != '' THEN
      _safe_role := _raw_role::user_role;
    ELSE
      _safe_role := 'patient'::user_role;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Role is not in the Referti user_role enum (e.g. MDL-only roles)
    _safe_role := 'patient'::user_role;
  END;

  INSERT INTO public.users (
    auth_id, email, first_name, last_name, fiscal_code,
    role, is_active, is_email_verified, language, timezone
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'fiscal_code', NULL),
    _safe_role,
    true,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    COALESCE(NEW.raw_user_meta_data->>'language', 'it'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Europe/Rome')
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    is_email_verified = EXCLUDED.is_email_verified,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- NOTE: The trigger itself does NOT need to be re-created.
-- DROP TRIGGER + CREATE TRIGGER is NOT needed because we are only replacing
-- the function body. The existing trigger on auth.users will call the
-- updated function automatically.
