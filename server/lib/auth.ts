import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { users, sessions, accounts, verifications, profiles } from '../db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications
    }
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Password reset link for ${user.email}: ${url}`);
    }
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(profiles).values({ id: user.id }).onConflictDoNothing();
        }
      }
    }
  }
});

export type Auth = typeof auth;
