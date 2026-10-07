-- CaseCoach Phase 3: practice sessions, mistakes, per-case progress, LLM usage.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this file → Run.
-- Every table is protected by Row Level Security: each signed-in user sees only their own rows.

create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  case_id       text not null,
  case_title    text not null,
  firm_mode     text not null check (firm_mode in ('mckinsey','bcg','bain','tier2')),
  source        text not null check (source in ('claude-handoff','in-app')),
  started_at    timestamptz not null default now(),
  duration_min  numeric,
  hints_used    int not null default 0,
  overall       numeric,
  scores        jsonb not null default '{}'::jsonb,   -- {structure: 4, quant: 3, ...}
  scorecard     jsonb not null default '{}'::jsonb,   -- full scorecard (evidence quotes, drills, ...)
  transcript    text,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists sessions_user_time on public.sessions (user_id, started_at desc);

create table if not exists public.mistakes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  case_id     text not null,
  category    text not null,
  description text not null,
  quote       text,
  created_at  timestamptz not null default now()
);
create index if not exists mistakes_user_cat on public.mistakes (user_id, category, created_at desc);

create table if not exists public.case_progress (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  case_id    text not null,
  solved     boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

-- Monthly LLM spend tracking for the (optional) in-app interviewer.
create table if not exists public.llm_usage (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  model         text not null,
  input_tokens  int not null,
  output_tokens int not null,
  cost_usd      numeric not null
);
create index if not exists llm_usage_time on public.llm_usage (created_at);

alter table public.sessions      enable row level security;
alter table public.mistakes      enable row level security;
alter table public.case_progress enable row level security;
alter table public.llm_usage     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sessions','mistakes','case_progress','llm_usage'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
