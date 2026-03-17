-- Courses table (producer-owned)

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses enable row level security;

-- Producer can only access their own courses
create policy "courses_select_own"
on public.courses for select to authenticated
using (producer_id = auth.uid());

create policy "courses_insert_own"
on public.courses for insert to authenticated
with check (producer_id = auth.uid());

create policy "courses_update_own"
on public.courses for update to authenticated
using (producer_id = auth.uid())
with check (producer_id = auth.uid());

create policy "courses_delete_own"
on public.courses for delete to authenticated
using (producer_id = auth.uid());

-- Reuse set_updated_at for courses
drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

-- Storage bucket "course-covers" must be created manually in Supabase Dashboard (private).
-- Path pattern: {producer_id}/{course_id}/cover.{ext}
