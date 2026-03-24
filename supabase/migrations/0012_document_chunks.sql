-- Enable pgvector extension (safe to re-run)
create extension if not exists vector;

-- Create document_chunks table
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  course_pdf_id uuid not null references public.course_pdfs (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_course_id_idx on public.document_chunks (course_id);
create index if not exists document_chunks_course_pdf_id_idx on public.document_chunks (course_pdf_id);

alter table public.document_chunks enable row level security;

-- Producers can read chunks that belong to their own courses
create policy "producers_select_own_chunks"
on public.document_chunks for select to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = document_chunks.course_id
    and courses.producer_id = auth.uid()
  )
);
