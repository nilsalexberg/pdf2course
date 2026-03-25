-- Enable Supabase Realtime on the courses table so clients can receive
-- live status updates during AI course generation without polling.
-- Wrapped in a DO block for idempotency: safe to run more than once.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'courses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE courses;
  END IF;
END $$;
