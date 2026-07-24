-- Phase 3 foundations: Stripe Connect for vendor-direct, license attestation on entitlements,
-- and metered billing helpers.

-- Stripe Connect: vendors who onboard as connected accounts
create table if not exists public.vendor_stripe_connect (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  stripe_account_id text not null,
  onboarding_complete boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vendor_stripe_connect enable row level security;

-- License attestations — records what a buyer agreed to at checkout
create table if not exists public.license_attestations (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id),
  license_version text not null,
  attestations jsonb not null default '[]',  -- array of strings: ["internal_use_only", "no_ml_training", ...]
  agreed_by_user_id uuid,
  agreed_at timestamptz not null default now()
);
create index if not exists license_attestations_entitlement_id on public.license_attestations(entitlement_id);
alter table public.license_attestations enable row level security;
create policy "Org members can view their license attestations"
  on public.license_attestations for select
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

-- Daily usage aggregates for metered billing reports (populated by cron or worker)
create table if not exists public.usage_daily_aggregates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entitlement_id uuid references public.entitlements(id) on delete set null,
  date date not null,
  total_units bigint not null default 0,
  unique (organization_id, entitlement_id, date)
);
create index if not exists usage_daily_aggregates_org_date on public.usage_daily_aggregates(organization_id, date desc);
alter table public.usage_daily_aggregates enable row level security;
create policy "Org members can view their usage aggregates"
  on public.usage_daily_aggregates for select
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

-- Vendor Connect onboarding: update marketplace_listings to track application fee %
alter table public.marketplace_listings
  add column if not exists platform_fee_percent numeric not null default 10,
  add column if not exists stripe_connect_account_id text;

-- Required attestations per listing (e.g. ["internal_use_only", "no_ml_training"])
alter table public.marketplace_listings
  add column if not exists required_attestations text[] not null default '{}';
