-- Add generation_status to courses table to track AI pipeline progress
-- This is separate from the visibility `status` field (draft/pending_review/approved/rejected)

CREATE TYPE course_generation_status AS ENUM (
  'idle',
  'processing',
  'generating_structure',
  'ready',
  'failed'
);

ALTER TABLE courses
  ADD COLUMN generation_status course_generation_status NOT NULL DEFAULT 'idle',
  ADD COLUMN generation_error text DEFAULT NULL;
