-- Without REPLICA IDENTITY FULL, Supabase Realtime cannot evaluate RLS policies
-- for UPDATE events on tables with RLS enabled. The old row values are not present
-- in the WAL with the default REPLICA IDENTITY, causing realtime changes to be
-- silently dropped for authenticated subscribers.
--
-- See: https://supabase.com/docs/guides/realtime/postgres-changes#replication-full
ALTER TABLE public.courses REPLICA IDENTITY FULL;
