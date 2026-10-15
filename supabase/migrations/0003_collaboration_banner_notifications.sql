alter table public.events add column if not exists important boolean not null default false;
alter table public.events add column if not exists notification_status text;
alter table public.tests add column if not exists max_score numeric;
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('PENDENTE','CONFIRMADO','PUBLICADO','RECUSADO'));

create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.feedbacks (
  id text primary key,
  target_kind text not null check (target_kind in ('registros','testes','eventos')),
  target_id text not null,
  author_tag text not null check (author_tag in ('DIREÇÃO','COORDENAÇÃO','TÉCNICO')),
  message text not null check (char_length(message) between 1 and 2000),
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists feedbacks_target_idx on public.feedbacks(target_kind, target_id, created_at);

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

alter table public.app_settings enable row level security;
alter table public.feedbacks enable row level security;
alter table public.banners enable row level security;

create policy "Permitir leitura publica de feedbacks" on public.feedbacks for select using (true);
create policy "Permitir leitura publica de banners" on public.banners for select using (true);
