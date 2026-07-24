-- Organizations, org members, and per-org API keys
-- Builds on 013_marketplace_mcp_skeleton.sql

-- Buyer / seller organizations
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

-- Org membership with roles (must exist before orgs RLS policy)
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

-- RLS policies (after both tables exist)
drop policy if exists "Org members can view their org" on public.organizations;
create policy "Org members can view their org"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );

drop policy if exists "Users can view their own memberships" on public.org_members;
create policy "Users can view their own memberships"
  on public.org_members for select
  using (user_id = auth.uid());

-- Per-org API keys (hashed). One key per row; key itself never stored, only sha256 + display prefix.
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
  using (
    organization_id in (
      select organization_id from public.org_members where user_id = auth.uid()
    )
  );
