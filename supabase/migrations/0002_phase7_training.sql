-- CaseCoach Phase 7: drills, flashcards, fit stories, casing-partner feedback.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this file → Run. Safe to re-run.

-- One table for small per-user records: drill results ('drill'), flashcard state ('srs'), fit stories ('story').
create table if not exists public.user_items (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('drill','srs','story')),
  key        text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);
create index if not exists user_items_kind_time on public.user_items (user_id, kind, updated_at desc);
alter table public.user_items enable row level security;
drop policy if exists "own rows" on public.user_items;
create policy "own rows" on public.user_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A casing partner scores a candidate; the candidate sees it and can add it to their journal.
create table if not exists public.partner_feedback (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_email    text not null,
  candidate_email text not null,
  case_id         text not null,
  case_title      text not null,
  firm_mode       text not null default 'bain',
  duration_min    numeric,
  scorecard       jsonb not null,
  imported        boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists partner_feedback_candidate on public.partner_feedback (lower(candidate_email), created_at desc);
alter table public.partner_feedback enable row level security;
drop policy if exists "author inserts own" on public.partner_feedback;
drop policy if exists "author or candidate reads" on public.partner_feedback;
drop policy if exists "candidate marks imported" on public.partner_feedback;
drop policy if exists "author deletes" on public.partner_feedback;
create policy "author inserts own" on public.partner_feedback for insert to authenticated
  with check (author_id = auth.uid() and lower(author_email) = lower(auth.jwt() ->> 'email'));
create policy "author or candidate reads" on public.partner_feedback for select to authenticated
  using (author_id = auth.uid() or lower(candidate_email) = lower(auth.jwt() ->> 'email'));
create policy "candidate marks imported" on public.partner_feedback for update to authenticated
  using (lower(candidate_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(candidate_email) = lower(auth.jwt() ->> 'email'));
create policy "author deletes" on public.partner_feedback for delete to authenticated
  using (author_id = auth.uid());

-- Sessions imported from partner feedback.
alter table public.sessions drop constraint if exists sessions_source_check;
alter table public.sessions add constraint sessions_source_check check (source in ('claude-handoff','in-app','partner'));
