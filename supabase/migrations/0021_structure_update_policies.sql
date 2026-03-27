-- Allow producers to update their own modules
create policy "producers_update_own_modules"
on public.modules for update to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = modules.course_id
    and courses.producer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.courses
    where courses.id = modules.course_id
    and courses.producer_id = auth.uid()
  )
);
