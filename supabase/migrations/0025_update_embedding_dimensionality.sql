-- Drop dependent functions first to allow altering/dropping the embedding column
drop function if exists public.match_document_chunks(vector, double precision, integer, uuid);
drop function if exists public.match_document_chunks(uuid, vector, integer);

-- Drop and recreate the embedding column on public.document_chunks with 3072 dimensions
alter table public.document_chunks drop column if exists embedding;
alter table public.document_chunks add column embedding vector(3072);

-- Recreate the first match_document_chunks function (from migration 0014)
create or replace function match_document_chunks (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_course_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where document_chunks.course_id = p_course_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Recreate the second match_document_chunks function (from migration 0018)
create or replace function match_document_chunks(
  p_course_id uuid,
  p_query_embedding vector(3072),
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
