import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { resolve } from 'path';
import { existsSync } from 'fs';

// TODO(Issue 1): The embedding column and match_document_chunks function are applied via
// raw SQL below, untracked by Drizzle. They should be extracted into a dedicated migration
// (e.g. drizzle/migrations/0002_vector_setup.sql), but the Drizzle schema intentionally
// omits the vector column (pgvector not natively supported by Drizzle) — doing so would
// require a schema plugin or custom type, which is an architectural decision beyond this file.

const EMBEDDING_DIMENSIONS = 3072;

export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('[migrate] DATABASE_URL is required');
  }

  const migrationsFolder = resolve(process.cwd(), 'drizzle/migrations');
  if (!existsSync(migrationsFolder)) {
    console.warn('[migrate] No migrations folder found — run `pnpm db:generate`');
    return;
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    } catch (err) {
      console.warn('[migrate] Could not create pgcrypto extension (may require superuser):', err);
    }

    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    } catch (err) {
      console.warn('[migrate] Could not create vector extension (may require superuser):', err);
    }

    await migrate(db, { migrationsFolder });

    await db.execute(
      sql`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(${sql.raw(String(EMBEDDING_DIMENSIONS))})`
    );

    await db.execute(sql`
      CREATE OR REPLACE FUNCTION match_document_chunks(
        p_course_id       uuid,
        p_query_embedding vector(${sql.raw(String(EMBEDDING_DIMENSIONS))}),
        p_match_count     int default 5
      )
      RETURNS TABLE (id uuid, content text, similarity float)
      LANGUAGE sql STABLE
      AS $$
        SELECT id, content, 1 - (embedding <=> p_query_embedding) AS similarity
        FROM document_chunks
        WHERE course_id = p_course_id AND embedding IS NOT NULL
        ORDER BY embedding <=> p_query_embedding
        LIMIT p_match_count;
      $$
    `);

    console.log('[migrate] Migrations applied successfully');
  } catch (err) {
    console.error('[migrate] Fatal error:', err);
    throw err;
  } finally {
    await client.end();
  }
});
