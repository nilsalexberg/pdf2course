-- Migration: Remove role check constraint from profiles table
-- This allows any string for roles, effectively merging producer and student

-- First, find the name of the constraint if it exists. 
-- In migration 0001 it was defined as "role text check (role in ('admin', 'producer', 'student'))"
-- Postgres usually names these like "profiles_role_check"

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- If we want to strictly keep only 'admin' and something else, we could add a new constraint.
-- But the user said "todo usuário pode ser produtor e aluno ao mesmo tempo", 
-- so 'admin' vs 'user' (or just anything) is fine.
-- Let's keep it simple and just remove the restriction for now.

-- Optional: Update existing 'producer' and 'student' to a generic 'user' role
-- UPDATE public.profiles SET role = 'user' WHERE role IN ('producer', 'student');
