## Auth & Supabase – Desenvolvimento

1. Crie um projeto no Supabase e configure:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_KEY`
2. Copie `.env.example` para `.env` e preencha:
   - `SUPABASE_URL=...`
   - `SUPABASE_PUBLISHABLE_KEY=...`
   - `SUPABASE_KEY=...`
   - `SITE_URL=http://localhost:3000`
3. Rode as migrations em `supabase/migrations` no banco do Supabase.
4. Crie o bucket de storage **course-covers** no Supabase (Storage → New bucket), privado. Para o upload e leitura de capas funcionarem, adicione políticas que permitam utilizadores autenticados a fazer upload e leitura em pastas com o nome do seu `auth.uid()` (ex.: policy para `(storage.foldername(name))[1] = auth.uid()::text`).

### Google OAuth (opcional neste momento)

1. Ative o provedor Google no painel do Supabase.
2. No Google Cloud Console, configure o OAuth com redirect:
   - `https://<seu-projeto>.supabase.co/auth/v1/callback`
3. Garanta que `SITE_URL` em `.env` aponta para a URL pública da app.
4. O botão “Continuar com Google” em `/auth/login` usará essa configuração automaticamente.
