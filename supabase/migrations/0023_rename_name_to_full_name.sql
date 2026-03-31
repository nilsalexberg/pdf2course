-- Rename name column to full_name for clarity and frontend consistency
ALTER TABLE public.profiles RENAME COLUMN name TO full_name;

-- Update handle_new_user to use the new column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
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
