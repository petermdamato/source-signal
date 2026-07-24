-- Marketplace listings, plans, subscriptions, entitlements, usage, and webhooks
-- Builds on 014_organizations_api_keys.sql

-- Extend api_products with marketplace fields
alter table public.api_products
  add column if not exists openapi_url text,
  add column if not exists connector_type text default 'rest_apikey',
  add column if not exists pricing_model text default 'contact',
  add column if not exists status text not null default 'draft' check (status in ('draft', 'published', 'archived'));

-- Marketplace listings — purchasable offers tied to a vendor
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  company_id uuid not null references public.companies(id) on delete cascade,
  api_product_id uuid references public.api_products(id) on delete set null,
  dataset_id uuid references public.datasets(id) on delete set null,
  title text not null,
  tagline text,
  description text,
  fulfillment_mode text not null default 'vendor_direct'
    check (fulfillment_mode in ('platform', 'vendor_direct')),
  license_summary text,          -- short human-readable terms
  license_version text not null default '1.0',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_listings_company_id on public.marketplace_listings(company_id);
alter table public.marketplace_listings enable row level security;
create policy "Published listings are viewable by everyone"
  on public.marketplace_listings for select using (published = true);

-- Plans for each listing
create table if not exists public.marketplace_plans (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  name text not null,                   -- e.g. "Starter", "Pro", "Enterprise"
  price_cents integer not null default 0,
  currency text not null default 'usd',
  interval text check (interval in ('month', 'year', 'one_time', 'usage', 'free')),
  trial_days integer not null default 0,
  quota jsonb not null default '{}',    -- e.g. {"requests_per_month": 10000}
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists marketplace_plans_listing_id on public.marketplace_plans(listing_id);
alter table public.marketplace_plans enable row level security;
create policy "Plans are viewable by everyone"
  on public.marketplace_plans for select using (true);

-- Subscriptions — org subscribes to a plan
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.marketplace_plans(id),
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_organization_id on public.subscriptions(organization_id);
create index if not exists subscriptions_stripe_subscription_id on public.subscriptions(stripe_subscription_id);
create index if not exists subscriptions_stripe_checkout_session_id on public.subscriptions(stripe_checkout_session_id);
alter table public.subscriptions enable row level security;
create policy "Org members can view their subscriptions"
  on public.subscriptions for select
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

-- Entitlements — what an org is licensed to access
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  status text not null default 'pending_provisioning'
    check (status in ('pending_provisioning', 'active', 'suspended', 'revoked')),
  license_accepted_at timestamptz,
  license_version text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entitlements_organization_id on public.entitlements(organization_id);
create index if not exists entitlements_listing_id on public.entitlements(listing_id);
alter table public.entitlements enable row level security;
create policy "Org members can view their entitlements"
  on public.entitlements for select
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

-- Usage events — append-only metering per entitlement
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entitlement_id uuid references public.entitlements(id) on delete set null,
  api_key_id uuid references public.org_api_keys(id) on delete set null,
  units integer not null default 1,
  event_type text not null default 'api_request',
  metadata jsonb not null default '{}',
  recorded_at timestamptz not null default now()
);
create index if not exists usage_events_organization_id on public.usage_events(organization_id);
create index if not exists usage_events_entitlement_id on public.usage_events(entitlement_id);
create index if not exists usage_events_recorded_at on public.usage_events(recorded_at desc);
alter table public.usage_events enable row level security;

-- Encrypted vendor credentials for platform-mode proxy (service role only, no RLS policy)
create table if not exists public.vendor_credentials (
  id uuid primary key default gen_random_uuid(),
  api_product_id uuid not null references public.api_products(id) on delete cascade,
  environment text not null default 'production' check (environment in ('sandbox', 'production')),
  credential_type text not null default 'api_key',
  encrypted_value text not null,   -- encrypted at application layer before insert
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (api_product_id, environment)
);
alter table public.vendor_credentials enable row level security;
-- No select policy: only service role can read these

-- Stripe webhook events — for idempotency
create table if not exists public.webhook_events (
  id text primary key,             -- Stripe event ID (evt_...)
  type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'
);
alter table public.webhook_events enable row level security;

-- Vendor interest / "sell your data" inquiries
create table if not exists public.vendor_interest_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_email text not null,
  contact_name text,
  website_url text,
  description text,
  created_at timestamptz not null default now()
);
alter table public.vendor_interest_inquiries enable row level security;
