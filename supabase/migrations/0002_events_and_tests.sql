create extension if not exists pg_trgm with schema extensions;

-- Tabela de Registros do Diário de Bordo
create table if not exists public.records (
  id text primary key,
  modality text not null check (modality in ('FLL','OBR')),
  status text not null default 'published',
  record_date date not null,
  title text not null,
  summary text not null default '',
  slug text not null,
  folder_path text,
  json_path text,
  cover_path text,
  cover_thumb_path text,
  tags text[] not null default '{}',
  author_name text not null default '',
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela de Eventos do Calendário
create table if not exists public.events (
  id text primary key,
  date date not null,
  title text not null,
  priority text not null check (priority in ('COMUM','URGENTE')),
  period text not null,
  lesson text not null,
  status text not null default 'PUBLICADO' check (status in ('PENDENTE','CONFIRMADO','PUBLICADO')),
  created_by text not null default '',
  comments text not null default '',
  created_at timestamptz not null default now()
);

-- Tabela de Testes e Simulações
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
  created_by text not null default '',
  created_at timestamptz not null default now()
);

-- Habilitar RLS
alter table public.records enable row level security;
alter table public.events enable row level security;
alter table public.tests enable row level security;

-- Políticas de Leitura Pública
create policy "Permitir leitura publica de records" on public.records for select using (true);
create policy "Permitir leitura publica de events" on public.events for select using (true);
create policy "Permitir leitura publica de tests" on public.tests for select using (true);
