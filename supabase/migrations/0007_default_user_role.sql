-- Migration: Set default user role to 'user'
-- This ensures all new profiles start with the 'user' role.

-- 1. Set default value for the role column
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- 2. Update handle_new_user function to be explicit (optional but recommended for clarity)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
