-- Create the course-covers bucket if it does not exist
insert into storage.buckets (id, name, public) 
values ('course-covers', 'course-covers', false)
on conflict (id) do nothing;



-- Policy to allow authenticated users to upload their own covers
create policy "Allow authenticated users to upload their own covers" 
on storage.objects for insert to authenticated
with check (
    bucket_id = 'course-covers' and 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to update their own covers
create policy "Allow authenticated users to update their own covers" 
on storage.objects for update to authenticated
using (
    bucket_id = 'course-covers' and 
    (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'course-covers' and 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to delete their own covers
create policy "Allow authenticated users to delete their own covers" 
on storage.objects for delete to authenticated
using (
    bucket_id = 'course-covers' and 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to select/read covers (can be restricted if needed, but signed URLs bypass RLS for select if the server uses service_role, wait, createSignedUrl operates under the user's permissions if we use the user's client. So they need read access to their own covers at least.)
-- We just let them select their own covers.
create policy "Allow authenticated users to read their own covers"
on storage.objects for select to authenticated
using (
    bucket_id = 'course-covers' and 
    (storage.foldername(name))[1] = auth.uid()::text
);
