-- Add extracted_text column to course_pdfs to store text extracted from PDF during AI pipeline
ALTER TABLE public.course_pdfs
  ADD COLUMN extracted_text text DEFAULT NULL;
