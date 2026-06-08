create table if not exists public.leads (
  id text primary key,
  user_id uuid null default null,
  name text not null,
  sector text not null,
  city text not null,
  address text default '',
  phone text default '',
  website text default '',
  description text default '',
  owner_name text default '',
  instagram_url text default '',
  facebook_url text default '',
  whatsapp_url text default '',
  logo_url text default '',
  followers_bucket text not null default 'Pendiente'
    check (followers_bucket in ('Pendiente', 'Sin cuenta', '< 1.000', '1.000 - 5.000', '+5.000')),
  content_use text not null default 'Pendiente'
    check (content_use in ('Pendiente', 'Sin uso', 'Flojo', 'Activo', 'Muy trabajado')),
  website_title text default '',
  google_maps_url text default '',
  rating numeric default 0,
  reviews integer default 0,
  google_photos integer default 0,
  place_id text default '',
  source text not null default 'manual'
    check (source in ('manual', 'google_places', 'importado', 'web')),
  is_invalid boolean not null default false,
  invalid_reason text default '',
  last_seen_at timestamptz,
  last_refreshed_at timestamptz,
  review_owner_candidates jsonb not null default '[]'::jsonb,
  latitude numeric,
  longitude numeric,
  business_status text default '',
  instagram_status text not null default 'pendiente'
    check (instagram_status in ('pendiente', 'no encontrado', 'verificado', 'manual')),
  next_follow_up_at timestamptz,
  next_follow_up_type text default '',
  last_visit_at timestamptz,
  visit_result text default '',
  proposed_plan text default '',
  estimated_monthly_value integer default 0,
  ads_signal text default '',
  score_total integer default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  score_reasons jsonb not null default '[]'::jsonb,
  score_confidence text not null default 'medium'
    check (score_confidence in ('low', 'medium', 'high')),
  data_sources jsonb not null default '[]'::jsonb,
  last_scored_at timestamptz,
  status text not null default 'Detectado'
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
    )),
  priority text not null default 'Media',
  potential integer default 0,
  last_contact text default 'Sin contacto',
  next_action text default '',
  pain text default '',
  diagnosis text default '',
  score integer default 0,
  signals jsonb not null default '{"web": false, "instagram": false, "facebook": false, "whatsapp": false, "photos": false, "googleProfile": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

grant usage on schema public to anon, authenticated, service_role;
revoke all on public.leads from anon;
grant select, insert, update, delete on public.leads to authenticated, service_role;

drop index if exists leads_place_id_idx;
create index leads_place_id_idx on public.leads (place_id) where place_id <> '';
create index if not exists leads_city_status_idx on public.leads (city, status);
create index if not exists leads_score_idx on public.leads (score desc);
create index if not exists leads_invalid_idx on public.leads (is_invalid);

drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own"
  on public.leads for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own"
  on public.leads for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "leads_update_own" on public.leads;
create policy "leads_update_own"
  on public.leads for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "leads_delete_own" on public.leads;
create policy "leads_delete_own"
  on public.leads for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "leads_select_shared" on public.leads;
drop policy if exists "leads_insert_shared" on public.leads;
drop policy if exists "leads_update_shared" on public.leads;
drop policy if exists "leads_delete_shared" on public.leads;

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

alter table public.lead_routes enable row level security;
alter table public.lead_route_items enable row level security;
alter table public.lead_calendar_events enable row level security;
alter table public.lead_proposals enable row level security;
alter table public.clients enable row level security;
alter table public.lead_to_client_links enable row level security;
alter table public.integration_status enable row level security;
alter table public.lead_enrichment_logs enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert, update, delete on
  public.lead_routes,
  public.lead_route_items,
  public.lead_calendar_events,
  public.lead_proposals,
  public.clients,
  public.lead_to_client_links,
  public.integration_status,
  public.lead_enrichment_logs,
  public.audit_logs
to authenticated, service_role;
