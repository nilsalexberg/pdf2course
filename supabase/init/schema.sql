-- pdf2course consolidated schema
-- Replaces all Supabase migrations. No auth.* references, no RLS.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ─── users (replaces auth.users) ─────────────────────────────────────────────

create table public.users (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  password_hash text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── profiles ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid        primary key references public.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text        not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── courses ──────────────────────────────────────────────────────────────────

create table public.courses (
  id                uuid        primary key default gen_random_uuid(),
  producer_id       uuid        not null references public.users(id) on delete cascade,
  title             text        not null,
  description       text,
  cover_url         text,
  status            text        not null default 'draft'
                                check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  rejection_reason  text,
  generation_status text        not null default 'idle'
                                check (generation_status in (
                                  'idle', 'processing', 'embedding', 'summarizing',
                                  'generating_structure', 'ready', 'failed'
                                )),
  generation_error  text,
  config            jsonb       not null default '{}',
  generated_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── course_pdfs ──────────────────────────────────────────────────────────────

create table public.course_pdfs (
  id             uuid        primary key default gen_random_uuid(),
  course_id      uuid        not null references public.courses(id) on delete cascade,
  file_path      text        not null,
  filename       text        not null,
  size_bytes     bigint      not null,
  extracted_text text,
  ai_summary     jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── document_chunks ──────────────────────────────────────────────────────────

create table public.document_chunks (
  id           uuid        primary key default gen_random_uuid(),
  course_id    uuid        not null references public.courses(id) on delete cascade,
  course_pdf_id uuid       not null references public.course_pdfs(id) on delete cascade,
  chunk_index  integer     not null,
  content      text        not null,
  embedding    vector(3072),
  created_at   timestamptz not null default now()
);

-- ─── modules ──────────────────────────────────────────────────────────────────

create table public.modules (
  id            uuid        primary key default gen_random_uuid(),
  course_id     uuid        not null references public.courses(id) on delete cascade,
  module_number integer     not null,
  title         text        not null,
  description   text        not null,
  created_at    timestamptz not null default now()
);

-- ─── lessons ──────────────────────────────────────────────────────────────────

create table public.lessons (
  id                  uuid        primary key default gen_random_uuid(),
  module_id           uuid        not null references public.modules(id) on delete cascade,
  course_id           uuid        not null references public.courses(id) on delete cascade,
  lesson_number       integer     not null,
  title               text        not null,
  description         text        not null,
  learning_objectives text[]      not null default '{}',
  key_topics          text[]      not null default '{}',
  status              text        not null default 'not_generated'
                                  check (status in ('not_generated', 'generating', 'ready', 'failed')),
  content             jsonb,
  generation_error    text,
  created_at          timestamptz not null default now()
);

-- ─── lesson_completions ───────────────────────────────────────────────────────

create table public.lesson_completions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.users(id) on delete cascade,
  lesson_id     uuid        not null references public.lessons(id) on delete cascade,
  course_id     uuid        not null references public.courses(id) on delete cascade,
  score_percent integer     not null,
  completed_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ─── indexes ──────────────────────────────────────────────────────────────────

create index on public.courses (producer_id);
create index on public.courses (status);
create index on public.course_pdfs (course_id);
create index on public.document_chunks (course_id);
create index on public.document_chunks (course_pdf_id);
create index on public.modules (course_id);
create index on public.lessons (module_id);
create index on public.lessons (course_id);
create index on public.lesson_completions (user_id, course_id);

-- ─── semantic search function ─────────────────────────────────────────────────

create or replace function match_document_chunks(
  p_course_id       uuid,
  p_query_embedding vector(3072),
  p_match_count     int default 5
)
returns table (id uuid, content text, similarity float)
language sql stable
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
