import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const sql = postgres(
  process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/pdf2course'
);
export const db = drizzle(sql, { schema });
