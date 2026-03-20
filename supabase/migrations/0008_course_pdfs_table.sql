-- Create course_pdfs table
create table if not exists public.course_pdfs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  file_path text not null,
  filename text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_pdfs enable row level security;

-- Policies for course_pdfs
create policy "producers_select_own_pdfs"
on public.course_pdfs for select to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = course_pdfs.course_id
    and courses.producer_id = auth.uid()
  )
);

create policy "producers_insert_own_pdfs"
on public.course_pdfs for insert to authenticated
with check (
  exists (
    select 1 from public.courses
    where courses.id = course_pdfs.course_id
    and courses.producer_id = auth.uid()
  )
);

create policy "producers_delete_own_pdfs"
on public.course_pdfs for delete to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = course_pdfs.course_id
    and courses.producer_id = auth.uid()
  )
);

-- Trigger for updated_at
drop trigger if exists course_pdfs_set_updated_at on public.course_pdfs;
create trigger course_pdfs_set_updated_at
before update on public.course_pdfs
for each row
execute function public.set_updated_at();
