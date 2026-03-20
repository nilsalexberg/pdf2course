-- Create the course-pdfs bucket if it does not exist
insert into storage.buckets (id, name, public) 
values ('course-pdfs', 'course-pdfs', false)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload their own PDFs
create policy "Allow authenticated users to upload their own PDFs" 
on storage.objects for insert to authenticated
with check (
    bucket_id = 'course-pdfs' and 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to update their own PDFs
create policy "Allow authenticated users to update their own PDFs" 
on storage.objects for update to authenticated
using (
    bucket_id = 'course-pdfs' and 
    (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'course-pdfs' and 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to delete their own PDFs
create policy "Allow authenticated users to delete their own PDFs" 
on storage.objects for delete to authenticated
using (
    bucket_id = 'course-pdfs' and 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to read their own PDFs
create policy "Allow authenticated users to read their own PDFs"
on storage.objects for select to authenticated
using (
    bucket_id = 'course-pdfs' and 
    (storage.foldername(name))[1] = auth.uid()::text
);
