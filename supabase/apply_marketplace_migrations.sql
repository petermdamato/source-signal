-- Run this entire file in Supabase Dashboard → SQL Editor → Run
-- Applies marketplace migrations 014, 015, and 016 in order.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ═══════════════════════════════════════════════════════════════════════════
-- 014: Organizations, org members, org API keys
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stripe_customer_id text,
  billing_email text,
  billing_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'developer' check (role in ('owner', 'developer', 'billing')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists org_members_organization_id on public.org_members(organization_id);
create index if not exists org_members_user_id on public.org_members(user_id);
alter table public.org_members enable row level security;

drop policy if exists "Org members can view their org" on public.organizations;
create policy "Org members can view their org"
  on public.organizations for select
  using (id in (select organization_id from public.org_members where user_id = auth.uid()));

drop policy if exists "Users can view their own memberships" on public.org_members;
create policy "Users can view their own memberships"
  on public.org_members for select
  using (user_id = auth.uid());

create table if not exists public.org_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_sha256 text not null,
  scopes text[] not null default array['catalog:read'],
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists org_api_keys_organization_id on public.org_api_keys(organization_id);
create index if not exists org_api_keys_key_sha256 on public.org_api_keys(key_sha256);
alter table public.org_api_keys enable row level security;

drop policy if exists "Org members can view their org keys" on public.org_api_keys;
create policy "Org members can view their org keys"
  on public.org_api_keys for select
  using (organization_id in (select organization_id from public.org_members where user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 015: Marketplace commerce
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.api_products
  add column if not exists openapi_url text,
  add column if not exists connector_type text default 'rest_apikey',
  add column if not exists pricing_model text default 'contact',
  add column if not exists status text not null default 'draft';

-- Add check constraint only if column was just created without it
do $$ begin
  alter table public.api_products
    add constraint api_products_status_check
    check (status in ('draft', 'published', 'archived'));
exception when duplicate_object then null;
end $$;

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
  license_summary text,
  license_version text not null default '1.0',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_listings_company_id on public.marketplace_listings(company_id);
alter table public.marketplace_listings enable row level security;

drop policy if exists "Published listings are viewable by everyone" on public.marketplace_listings;
create policy "Published listings are viewable by everyone"
  on public.marketplace_listings for select using (published = true);

create table if not exists public.marketplace_plans (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  name text not null,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  interval text check (interval in ('month', 'year', 'one_time', 'usage', 'free')),
  trial_days integer not null default 0,
  quota jsonb not null default '{}',
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists marketplace_plans_listing_id on public.marketplace_plans(listing_id);
alter table public.marketplace_plans enable row level security;

drop policy if exists "Plans are viewable by everyone" on public.marketplace_plans;
create policy "Plans are viewable by everyone"
  on public.marketplace_plans for select using (true);

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

drop policy if exists "Org members can view their subscriptions" on public.subscriptions;
create policy "Org members can view their subscriptions"
  on public.subscriptions for select
  using (organization_id in (select organization_id from public.org_members where user_id = auth.uid()));

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

drop policy if exists "Org members can view their entitlements" on public.entitlements;
create policy "Org members can view their entitlements"
  on public.entitlements for select
  using (organization_id in (select organization_id from public.org_members where user_id = auth.uid()));

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

create table if not exists public.vendor_credentials (
  id uuid primary key default gen_random_uuid(),
  api_product_id uuid not null references public.api_products(id) on delete cascade,
  environment text not null default 'production' check (environment in ('sandbox', 'production')),
  credential_type text not null default 'api_key',
  encrypted_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (api_product_id, environment)
);
alter table public.vendor_credentials enable row level security;

create table if not exists public.webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'
);
alter table public.webhook_events enable row level security;

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 016: Stripe Connect, license attestations, usage aggregates
-- ═══════════════════════════════════════════════════════════════════════════

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

create table if not exists public.license_attestations (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id),
  license_version text not null,
  attestations jsonb not null default '[]',
  agreed_by_user_id uuid,
  agreed_at timestamptz not null default now()
);
create index if not exists license_attestations_entitlement_id on public.license_attestations(entitlement_id);
alter table public.license_attestations enable row level security;

drop policy if exists "Org members can view their license attestations" on public.license_attestations;
create policy "Org members can view their license attestations"
  on public.license_attestations for select
  using (organization_id in (select organization_id from public.org_members where user_id = auth.uid()));

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

drop policy if exists "Org members can view their usage aggregates" on public.usage_daily_aggregates;
create policy "Org members can view their usage aggregates"
  on public.usage_daily_aggregates for select
  using (organization_id in (select organization_id from public.org_members where user_id = auth.uid()));

alter table public.marketplace_listings
  add column if not exists platform_fee_percent numeric not null default 10,
  add column if not exists stripe_connect_account_id text,
  add column if not exists required_attestations text[] not null default '{}';

-- ═══════════════════════════════════════════════════════════════════════════
-- 019: WattBuy marketplace seed (platform-connected, free, utility + green energy)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.marketplace_topics (slug, label, description, sort_order) values
  ('utility', 'Utility', 'Electric utility lookup, rates, usage, and service territory data', 130),
  ('green-energy', 'Green Energy', 'Solar estimates, carbon footprint, incentives, and clean-energy programs', 140)
on conflict (slug) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

do $$
declare
  v_company_id uuid;
  v_api_product_id uuid;
  v_listing_id uuid;
  v_topic_slug text;
  v_topic_slugs text[] := array['utility', 'green-energy'];
begin
  select id into v_company_id from public.companies where slug = 'wattbuy' limit 1;
  if v_company_id is null then
    insert into public.companies (name, slug, description, website_url, logo_url, category, subcategory, claimed)
    values (
      'WattBuy', 'wattbuy',
      'Personalized power platform APIs for utility lookup, electricity usage and cost estimates, solar sizing, carbon footprint, retail rates, and residential clean-energy incentives.',
      'https://wattbuy.com', '/wattbuy.png', 'Energy', 'Utilities & Clean Power', false
    ) returning id into v_company_id;
  end if;

  update public.companies set logo_url = '/wattbuy.png', updated_at = now()
  where id = v_company_id and (logo_url is null or logo_url = '');

  select id into v_api_product_id from public.api_products
  where company_id = v_company_id and name = 'WattBuy API' limit 1;
  if v_api_product_id is null then
    insert into public.api_products (company_id, name, base_url, docs_url, openapi_url, auth_type, connector_type, pricing_model, status)
    values (
      v_company_id, 'WattBuy API', 'https://apis.wattbuy.com/v3',
      'https://wattbuy.readme.io/reference/getting-started-with-your-api',
      'https://wattbuy.readme.io/reference/getting-started-with-your-api',
      'api_key', 'rest_apikey', 'free', 'published'
    ) returning id into v_api_product_id;
  end if;

  select id into v_listing_id from public.marketplace_listings where slug = 'wattbuy-api' limit 1;
  if v_listing_id is null then
    insert into public.marketplace_listings (
      slug, company_id, api_product_id, title, tagline, description,
      fulfillment_mode, license_summary, license_version, published, platform_fee_percent, required_attestations
    ) values (
      'wattbuy-api', v_company_id, v_api_product_id, 'WattBuy API',
      'Utility, usage, solar, carbon, and green-energy incentive data for U.S. homes',
      E'Access the WattBuy Personalized Power Platform for utility lookup, electricity usage and bill estimates, solar, carbon footprint, retail rates, and green-energy incentives.\n\nGet a free API key from WattBuy and call https://apis.wattbuy.com/v3 directly.',
      'vendor_direct',
      'Subject to WattBuy API Terms of Use. For application use via Source Signal marketplace entitlements only.',
      '1.0', true, 0, array['internal_use_only']
    ) returning id into v_listing_id;
  end if;

  if not exists (select 1 from public.marketplace_plans where listing_id = v_listing_id and name = 'Developer (free)') then
    insert into public.marketplace_plans (listing_id, name, price_cents, currency, interval, trial_days, quota, active)
    values (v_listing_id, 'Developer (free)', 0, 'usd', 'free', 0, '{"note": "Free via Source Signal gateway"}'::jsonb, true);
  end if;

  foreach v_topic_slug in array v_topic_slugs loop
    insert into public.marketplace_listing_topics (listing_id, topic_id)
    select v_listing_id, t.id from public.marketplace_topics t where t.slug = v_topic_slug
    on conflict do nothing;
  end loop;
end $$;
