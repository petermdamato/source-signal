-- Marketplace, MCP, public atlas stub, and AI connectivity scoring skeleton
-- Apply after existing migrations. RLS: public read where safe; sensitive tables service-role only.

-- Optional per-client API keys (hashed); no policies — use service role only
create table if not exists public.external_api_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_sha256 text not null,
  key_prefix text not null,
  created_at timestamptz not null default now()
);
alter table public.external_api_clients enable row level security;

-- Vendor-registered API products (metadata for MCP / marketplace)
create table if not exists public.api_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  base_url text,
  docs_url text,
  auth_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists api_products_company_id on public.api_products(company_id);
alter table public.api_products enable row level security;
create policy "API products are viewable by everyone"
  on public.api_products for select using (true);

-- Connection / RFQ stub
create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source text not null default 'api',
  requester_contact text,
  requester_note text,
  metadata jsonb not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists connection_requests_company_id on public.connection_requests(company_id);
create index if not exists connection_requests_created_at on public.connection_requests(created_at desc);
alter table public.connection_requests enable row level security;

-- Public data atlas stub (optional link to vendor)
create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  company_id uuid references public.companies(id) on delete set null,
  source_url text,
  created_at timestamptz not null default now()
);
create index if not exists datasets_company_id on public.datasets(company_id);
alter table public.datasets enable row level security;
create policy "Datasets are viewable by everyone"
  on public.datasets for select using (true);

-- AI connectivity probe runs
create table if not exists public.ai_connectivity_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  api_product_id uuid references public.api_products(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'pending',
  agent_version text not null default 'stub-0.1.0'
);
create index if not exists ai_connectivity_runs_company_id on public.ai_connectivity_runs(company_id);
create index if not exists ai_connectivity_runs_started_at on public.ai_connectivity_runs(started_at desc);
alter table public.ai_connectivity_runs enable row level security;

create table if not exists public.ai_connectivity_metrics (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_connectivity_runs(id) on delete cascade,
  metric_key text not null,
  numeric_value double precision,
  details jsonb not null default '{}'
);
create index if not exists ai_connectivity_metrics_run_id on public.ai_connectivity_metrics(run_id);
alter table public.ai_connectivity_metrics enable row level security;

create table if not exists public.ai_connectivity_scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  api_product_id uuid references public.api_products(id) on delete set null,
  score numeric not null,
  methodology_version text not null,
  computed_at timestamptz not null default now()
);
create index if not exists ai_connectivity_scores_company_id on public.ai_connectivity_scores(company_id);
create index if not exists ai_connectivity_scores_computed_at on public.ai_connectivity_scores(computed_at desc);
alter table public.ai_connectivity_scores enable row level security;
create policy "AI connectivity scores are viewable by everyone"
  on public.ai_connectivity_scores for select using (true);
