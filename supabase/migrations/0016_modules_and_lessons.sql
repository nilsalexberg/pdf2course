-- modules table
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_number integer not null,
  title text not null,
  description text not null,
  created_at timestamptz not null default now(),
  constraint modules_number_course_id_key unique (course_id, module_number)
);

create index if not exists modules_course_id_idx on public.modules (course_id);

alter table public.modules enable row level security;

create policy "producers_select_own_modules"
on public.modules for select to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = modules.course_id
    and courses.producer_id = auth.uid()
  )
);

-- lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_number integer not null,
  title text not null,
  description text not null,
  learning_objectives jsonb not null default '[]'::jsonb,
  key_topics jsonb not null default '[]'::jsonb,
  rag_search_queries jsonb not null default '[]'::jsonb,
  status text not null default 'not_generated',
  created_at timestamptz not null default now(),
  constraint lessons_number_module_id_key unique (module_id, lesson_number)
);

create index if not exists lessons_module_id_idx on public.lessons (module_id);
create index if not exists lessons_course_id_idx on public.lessons (course_id);

alter table public.lessons enable row level security;

create policy "producers_select_own_lessons"
on public.lessons for select to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
    and courses.producer_id = auth.uid()
  )
);

-- Track when course structure generation completed
alter table public.courses add column if not exists generated_at timestamptz;
