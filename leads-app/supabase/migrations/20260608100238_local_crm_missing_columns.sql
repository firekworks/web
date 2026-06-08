alter table public.leads
  add column if not exists business_status text default '',
  add column if not exists score_reasons jsonb not null default '[]'::jsonb,
  add column if not exists last_scored_at timestamptz;
