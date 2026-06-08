alter table public.leads
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists business_status text default '',
  add column if not exists instagram_status text not null default 'pendiente',
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists next_follow_up_type text default '',
  add column if not exists last_visit_at timestamptz,
  add column if not exists visit_result text default '',
  add column if not exists proposed_plan text default '',
  add column if not exists estimated_monthly_value integer default 0,
  add column if not exists ads_signal text default '',
  add column if not exists score_total integer default 0,
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists score_reasons jsonb not null default '[]'::jsonb,
  add column if not exists score_confidence text not null default 'medium',
  add column if not exists data_sources jsonb not null default '[]'::jsonb,
  add column if not exists last_scored_at timestamptz;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads
  add constraint leads_status_check
  check (status in (
    'Detectado',
    'Validado',
    'Prioritario',
    'Contactado',
    'Respondió',
    'Reunión agendada',
    'Diagnóstico hecho',
    'Propuesta enviada',
    'Negociación',
    'Ganado',
    'Perdido',
    'No encaja',
    'No contactar'
  ));

alter table public.leads drop constraint if exists leads_instagram_status_check;
alter table public.leads
  add constraint leads_instagram_status_check
  check (instagram_status in ('pendiente', 'no encontrado', 'verificado', 'manual'));

alter table public.leads drop constraint if exists leads_score_confidence_check;
alter table public.leads
  add constraint leads_score_confidence_check
  check (score_confidence in ('low', 'medium', 'high'));

create table if not exists public.lead_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ruta presencial',
  owner_user_id uuid,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_route_items (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.lead_routes(id) on delete cascade,
  lead_id text references public.leads(id) on delete cascade,
  position integer not null default 0,
  visit_result text default '',
  visited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_calendar_events (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id) on delete cascade,
  title text not null,
  type text not null default 'Seguimiento comercial',
  status text not null default 'pending',
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id) on delete cascade,
  plan_name text not null,
  monthly_value integer default 0,
  ad_budget integer default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id),
  name text not null,
  city text default '',
  sector text default '',
  phone text default '',
  website text default '',
  fiscal_status text default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.lead_to_client_links (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lead_id, client_id)
);

create table if not exists public.integration_status (
  id text primary key,
  provider text not null,
  status text not null default 'pending',
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lead_enrichment_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id text references public.leads(id) on delete cascade,
  provider text not null,
  result text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id text not null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
alter table public.lead_routes enable row level security;
alter table public.lead_route_items enable row level security;
alter table public.lead_calendar_events enable row level security;
alter table public.lead_proposals enable row level security;
alter table public.clients enable row level security;
alter table public.lead_to_client_links enable row level security;
alter table public.integration_status enable row level security;
alter table public.lead_enrichment_logs enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.leads from anon;
grant select, insert, update, delete on public.leads to authenticated, service_role;

drop policy if exists "leads_select_shared" on public.leads;
drop policy if exists "leads_insert_shared" on public.leads;
drop policy if exists "leads_update_shared" on public.leads;
drop policy if exists "leads_delete_shared" on public.leads;
