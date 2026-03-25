-- Add content and error tracking columns to lessons
alter table public.lessons add column if not exists content jsonb;
alter table public.lessons add column if not exists generation_error text;

-- Allow authenticated producers to update their own lessons (needed for content generation)
create policy "producers_update_own_lessons"
on public.lessons for update to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
    and courses.producer_id = auth.uid()
  )
);

-- Semantic similarity search for document chunks.
-- security invoker: runs in the caller's session so RLS on document_chunks is respected.
-- Producers can only search their own course's chunks.
create or replace function match_document_chunks(
  p_course_id uuid,
  p_query_embedding vector(768),
  p_match_count int default 5
)
returns table (id uuid, content text, similarity float)
language sql stable security invoker
as $$
  select
    id,
    content,
    1 - (embedding <=> p_query_embedding) as similarity
  from public.document_chunks
  where course_id = p_course_id
    and embedding is not null
  order by embedding <=> p_query_embedding
  limit p_match_count;
$$;

grant execute on function match_document_chunks(uuid, vector, int) to authenticated;
