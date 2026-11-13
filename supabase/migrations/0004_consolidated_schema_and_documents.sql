-- ============================================================================
-- Hortobots Planning - Migracao Consolidada v2.2.0 + Marco 5 (Documentos)
-- ============================================================================

create extension if not exists pg_trgm with schema extensions;

-- 1. TABELA DE REGISTROS (DIARIOS DE BORDO)
create table if not exists public.records (
  id text primary key,
  modality text not null check (modality in ('FLL','OBR')),
  status text not null default 'published' check (status in ('pending','published','deleting')),
  record_date date not null,
  title text not null check (char_length(title) between 3 and 140),
  summary text not null default '',
  slug text not null,
  folder_path text,
  json_path text,
  cover_path text,
  cover_thumb_path text,
  tags text[] not null default '{}',
  author_name text not null default '',
  image_count int not null default 0,
  video_count int not null default 0,
  search_text text not null default '',
  doc_version int not null default 1,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists records_cal_idx on public.records (modality, record_date desc, created_at desc) where status='published';
create index if not exists records_status_idx on public.records (status, created_at);
create index if not exists records_tags_idx on public.records using gin(tags);

-- 2. TABELA DE AUDITORIA
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  action text not null check(action in ('create','update','delete','import','export','cleanup')),
  record_id text,
  modality text,
  title text,
  actor text,
  details jsonb not null default '{}'::jsonb
);
create index if not exists audit_logs_at_idx on public.audit_logs(at desc);

-- 3. TABELA DE EVENTOS DO CALENDARIO
create table if not exists public.events (
  id text primary key,
  date date not null,
  title text not null,
  priority text not null check (priority in ('COMUM','URGENTE')),
  period text not null,
  lesson text not null,
  status text not null default 'PUBLICADO' check (status in ('PENDENTE','CONFIRMADO','PUBLICADO','RECUSADO')),
  important boolean not null default false,
  notification_status text,
  created_by text not null default '',
  comments text not null default '',
  created_at timestamptz not null default now()
);

-- 4. TABELA DE TESTES E SIMULACOES
create table if not exists public.tests (
  id text primary key,
  modality text not null,
  team text not null,
  date date not null,
  title text not null,
  objective text not null,
  comments text not null default '',
  mission text not null default '',
  chart text not null default 'line',
  attempts jsonb not null default '[]'::jsonb,
  max_score numeric,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

-- 5. TABELA DE CONFIGURACOES DA APLICACAO
create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

-- 6. TABELA DE FEEDBACKS
create table if not exists public.feedbacks (
  id text primary key,
  target_kind text not null check (target_kind in ('registros','testes','eventos')),
  target_id text not null,
  author_tag text not null check (author_tag in ('DIRECAO','COORDENACAO','TECNICO')),
  message text not null check (char_length(message) between 1 and 2000),
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists feedbacks_target_idx on public.feedbacks(target_kind, target_id, created_at);

-- 7. TABELA DE BANNERS CIENTIFICOS
create table if not exists public.banners (
  team_key text primary key check (team_key in ('fll','under','obr')),
  modality text not null check (modality in ('FLL','OBR')),
  width_cm numeric not null,
  height_cm numeric not null,
  problem_question text not null,
  content jsonb not null,
  sources jsonb not null default '{}'::jsonb,
  version int not null default 1,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. TABELAS DA CENTRAL DE DOCUMENTOS DE COMPETICAO (MARCO 5)
create table if not exists public.competition_documents (
  id text primary key,
  competition text not null check (competition in ('FLL','OBR')),
  modality text not null,
  season_year text not null,
  doc_type text not null check (doc_type in ('rubrica','regras','complementar')),
  title text not null,
  description text not null default '',
  url_oficial text not null,
  file_path text,
  file_size_bytes bigint,
  mime_type text default 'application/pdf',
  sha256 text,
  version text not null default '1.0',
  is_current boolean not null default true,
  is_fallback boolean not null default false,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  created_by text not null default 'sistema',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comp_docs_query_idx on public.competition_documents (competition, modality, season_year, doc_type);

create table if not exists public.competition_updates (
  id text primary key,
  competition text not null check (competition in ('FLL','OBR')),
  modality text not null,
  title text not null,
  summary text not null,
  source_url text not null,
  published_at timestamptz not null,
  captured_at timestamptz not null default now(),
  is_critical boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comp_updates_pub_idx on public.competition_updates (competition, published_at desc);

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.records enable row level security;
alter table public.audit_logs enable row level security;
alter table public.events enable row level security;
alter table public.tests enable row level security;
alter table public.app_settings enable row level security;
alter table public.feedbacks enable row level security;
alter table public.banners enable row level security;
alter table public.competition_documents enable row level security;
alter table public.competition_updates enable row level security;

-- 10. POLITICAS RLS (LEITURA PUBLICA E CONTROLE DE SERVICO)
drop policy if exists "Permitir leitura publica de records" on public.records;
create policy "Permitir leitura publica de records" on public.records for select using (true);
create policy "Permitir escrita de records para service role" on public.records for all using (true) with check (true);

drop policy if exists "Permitir leitura publica de events" on public.events;
create policy "Permitir leitura publica de events" on public.events for select using (true);
create policy "Permitir escrita de events para service role" on public.events for all using (true) with check (true);

drop policy if exists "Permitir leitura publica de tests" on public.tests;
create policy "Permitir leitura publica de tests" on public.tests for select using (true);
create policy "Permitir escrita de tests para service role" on public.tests for all using (true) with check (true);

drop policy if exists "Permitir leitura publica de feedbacks" on public.feedbacks;
create policy "Permitir leitura publica de feedbacks" on public.feedbacks for select using (true);
create policy "Permitir insercao de feedbacks" on public.feedbacks for insert with check (true);
create policy "Permitir exclusao de feedbacks" on public.feedbacks for delete using (true);

drop policy if exists "Permitir leitura publica de banners" on public.banners;
create policy "Permitir leitura publica de banners" on public.banners for select using (true);
create policy "Permitir escrita de banners" on public.banners for all using (true) with check (true);

drop policy if exists "Permitir leitura publica de app_settings" on public.app_settings;
create policy "Permitir leitura publica de app_settings" on public.app_settings for select using (true);
create policy "Permitir escrita de app_settings" on public.app_settings for all using (true) with check (true);

drop policy if exists "Permitir leitura publica de competition_documents" on public.competition_documents;
create policy "Permitir leitura publica de competition_documents" on public.competition_documents for select using (true);
create policy "Permitir escrita de competition_documents para service role" on public.competition_documents for all using (true) with check (true);

drop policy if exists "Permitir leitura publica de competition_updates" on public.competition_updates;
create policy "Permitir leitura publica de competition_updates" on public.competition_updates for select using (true);
create policy "Permitir escrita de competition_updates para service role" on public.competition_updates for all using (true) with check (true);

-- 11. BUCKET DE STORAGE (hortobots-planning)
insert into storage.buckets (id, name, public)
values ('hortobots-planning', 'hortobots-planning', true)
on conflict (id) do update set public = true;

drop policy if exists "Permitir leitura publica de objetos no bucket hortobots-planning" on storage.objects;
create policy "Permitir leitura publica de objetos no bucket hortobots-planning"
on storage.objects for select using (bucket_id = 'hortobots-planning');

drop policy if exists "Permitir escrita no bucket hortobots-planning" on storage.objects;
create policy "Permitir escrita no bucket hortobots-planning"
on storage.objects for all using (bucket_id = 'hortobots-planning') with check (bucket_id = 'hortobots-planning');

