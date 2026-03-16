-- Allow setting role exactly once (producer|student), admin set manually

create or replace function public.set_role(new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if new_role not in ('producer', 'student') then
    raise exception 'invalid_role';
  end if;

  select * into p from public.profiles where id = auth.uid();
  if p.id is null then
    raise exception 'profile_missing';
  end if;

  -- Role can be set once; admin is managed separately
  if p.role is not null then
    raise exception 'role_already_set';
  end if;

  update public.profiles
  set role = new_role
  where id = auth.uid()
  returning * into p;

  return p;
end;
$$;

revoke all on function public.set_role(text) from public;
grant execute on function public.set_role(text) to authenticated;

