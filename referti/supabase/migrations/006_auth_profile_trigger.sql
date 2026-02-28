-- ============================================================================
-- 006: Auth → public.users auto-profile creation trigger
-- Ensures a profile row is created in public.users whenever a new user
-- signs up via Supabase Auth. Also syncs email confirmation status on update.
-- ============================================================================

-- Function: handle new auth user → insert into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    auth_id, email, first_name, last_name, fiscal_code,
    role, is_active, is_email_verified, language, timezone
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'fiscal_code', NULL),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient'::user_role),
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

-- Trigger: fires after INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function: sync email confirmation status on auth user update
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    is_email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    email = NEW.email,
    updated_at = NOW()
  WHERE auth_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger: fires after UPDATE on auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_updated();
