# Implantação

1. Crie um projeto Supabase e execute `supabase/migrations/0001_init.sql`.
2. Crie o bucket privado `hortobots-planning`, sem políticas públicas.
3. Envie o repositório para um repositório privado no GitHub.
4. No Render, aplique o Blueprint `render.yaml`.
5. Configure na API `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEB_ORIGIN` e `WRITE_PASSCODE`.
6. Configure no site `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
7. Depois do primeiro deploy, confira `/api/health`, crie um registro de teste e valide a pasta correspondente no Storage.

Nunca coloque a chave `service_role` no frontend, no repositório ou em arquivos de registro.
