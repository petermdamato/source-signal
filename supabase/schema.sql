-- Source Signal: data vendor directory schema for Supabase
-- Run this in the Supabase SQL editor to create tables.

-- Profiles (display names, synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  industry text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Companies (data vendors)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,  -- auto-generated from name + category + subcategory (see migration 007)
  description text,
  logo_url text,
  website_url text,
  category text,
  subcategory text,
  delivery_method_ids uuid[] default '{}',
  data_attribute_ids uuid[] default '{}',
  claimed boolean not null default false,
  claimed_contact text,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Company claim verification tokens (server-only; RLS has no policies so only service role can access)
create table if not exists public.company_claim_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.company_claim_tokens enable row level security;

-- AI vendor search sessions (collected criteria per search)
create table if not exists public.ai_search_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  topic text,
  subject_population text,
  years_dates text,
  ownership text,
  data_type text,
  data_use text,
  geography text,
  other_details text,
  raw_messages jsonb
);
alter table public.ai_search_sessions enable row level security;
create policy "Anyone can insert ai_search_sessions" on public.ai_search_sessions for insert with check (true);
create policy "Anyone can select ai_search_sessions" on public.ai_search_sessions for select using (true);

-- Delivery methods (fixed list; companies.delivery_method_ids references these)
create table if not exists public.data_delivery_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Data attributes (public = in search dropdown; companies.data_attribute_ids references these)
create table if not exists public.data_attributes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  public boolean not null default true
);

alter table public.data_delivery_methods enable row level security;
create policy "Delivery methods are viewable by everyone"
  on public.data_delivery_methods for select using (true);

alter table public.data_attributes enable row level security;
create policy "Data attributes are viewable by everyone"
  on public.data_attributes for select using (true);
create policy "Authenticated users can insert data attributes"
  on public.data_attributes for insert with check (auth.role() = 'authenticated');

-- Reviews (user reviews of companies)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  title text not null,
  body text,
  ease_of_access_rating int default 5 check (ease_of_access_rating is null or (ease_of_access_rating >= 1 and ease_of_access_rating <= 5)),
  sales_team_rating int default 5 check (sales_team_rating is null or (sales_team_rating >= 1 and sales_team_rating <= 5)),
  data_coverage_rating int default 5 check (data_coverage_rating is null or (data_coverage_rating >= 1 and data_coverage_rating <= 5)),
  value_rating int default 5 check (value_rating is null or (value_rating >= 1 and value_rating <= 5)),
  found_when text,
  result text,
  hidden boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.companies enable row level security;
alter table public.reviews enable row level security;

-- Companies: read all, insert/update/delete for authenticated (or restrict to admin later)
create policy "Companies are viewable by everyone"
  on public.companies for select using (true);

create policy "Authenticated users can insert companies"
  on public.companies for insert with check (auth.role() = 'authenticated');

create policy "Users can update unclaimed companies or own claimed company"
  on public.companies for update
  using (
    (claimed = false and auth.role() = 'authenticated')
    or (claimed = true and claimed_by_user_id = auth.uid())
  );

-- Reviews: read all, insert own, update/delete own
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Users can insert own reviews"
  on public.reviews for insert with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete using (auth.uid() = user_id);

-- User bookmarks (saved companies)
create table if not exists public.user_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, company_id)
);

alter table public.user_bookmarks enable row level security;
create policy "Users can view own bookmarks" on public.user_bookmarks for select using (auth.uid() = user_id);
create policy "Users can insert own bookmarks" on public.user_bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can delete own bookmarks" on public.user_bookmarks for delete using (auth.uid() = user_id);
create index if not exists user_bookmarks_user_id on public.user_bookmarks(user_id);

-- Indexes
create index if not exists reviews_company_id on public.reviews(company_id);
create index if not exists reviews_user_id on public.reviews(user_id);
create index if not exists companies_slug on public.companies(slug);
create index if not exists companies_category on public.companies(category);
create index if not exists companies_subcategory on public.companies(category, subcategory);

-- Marketplace / MCP / AI connectivity: see migration 013_marketplace_mcp_skeleton.sql
-- (external_api_clients, api_products, connection_requests, datasets, ai_connectivity_*)
