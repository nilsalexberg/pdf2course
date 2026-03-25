create table if not exists public.lesson_completions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  lesson_id     uuid        not null references public.lessons (id) on delete cascade,
  course_id     uuid        not null references public.courses (id) on delete cascade,
  score_percent integer     not null check (score_percent between 0 and 100),
  completed_at  timestamptz not null default now(),
  constraint lesson_completions_user_lesson_key unique (user_id, lesson_id)
);

create index if not exists lesson_completions_user_course_idx
  on public.lesson_completions (user_id, course_id);

alter table public.lesson_completions enable row level security;

create policy "users_select_own_completions"
  on public.lesson_completions for select to authenticated
  using (user_id = auth.uid());

create policy "users_insert_own_completions"
  on public.lesson_completions for insert to authenticated
  with check (user_id = auth.uid());

create policy "users_update_own_completions"
  on public.lesson_completions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
