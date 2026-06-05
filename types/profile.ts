export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
