-- Marketplace listing topics (admin-assigned tags for discovery)
-- e.g. Population, Homeownership, Income & Poverty for Census Bureau

create table if not exists public.marketplace_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.marketplace_topics enable row level security;
drop policy if exists "Marketplace topics are viewable by everyone" on public.marketplace_topics;
create policy "Marketplace topics are viewable by everyone"
  on public.marketplace_topics for select using (true);

create table if not exists public.marketplace_listing_topics (
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  topic_id uuid not null references public.marketplace_topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, topic_id)
);
create index if not exists marketplace_listing_topics_topic_id on public.marketplace_listing_topics(topic_id);
alter table public.marketplace_listing_topics enable row level security;
drop policy if exists "Listing topics are viewable by everyone" on public.marketplace_listing_topics;
create policy "Listing topics are viewable by everyone"
  on public.marketplace_listing_topics for select using (true);

-- Canonical topic catalog (reusable across listings)
insert into public.marketplace_topics (slug, label, description, sort_order) values
  ('population', 'Population', 'Population counts, estimates, and demographic totals', 10),
  ('homeownership', 'Homeownership', 'Owner-occupied housing, tenure, and housing stock', 20),
  ('income-poverty', 'Income & Poverty', 'Household income, poverty status, and economic hardship', 30),
  ('transportation', 'Transportation', 'Commuting, vehicle availability, and transit use', 40),
  ('housing', 'Housing', 'Housing units, costs, vacancy, and characteristics', 50),
  ('education', 'Education', 'School enrollment, attainment, and educational characteristics', 60),
  ('employment', 'Employment', 'Labor force, occupation, industry, and unemployment', 70),
  ('health', 'Health', 'Health insurance coverage and disability status', 80),
  ('geography', 'Geography & Place', 'Geographic identifiers, urban/rural, and place boundaries', 90),
  ('business-economy', 'Business & Economy', 'Establishments, firms, and economic activity', 100),
  ('demographics', 'Demographics', 'Age, sex, race, ethnicity, and family structure', 110),
  ('immigration', 'Immigration & Origin', 'Place of birth, citizenship, and year of entry', 120)
on conflict (slug) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- Assign Census Bureau listing topics
do $$
declare
  v_listing_id uuid;
  v_topic_slug text;
  v_topic_slugs text[] := array[
    'population',
    'homeownership',
    'income-poverty',
    'transportation',
    'housing',
    'education',
    'employment',
    'health',
    'geography',
    'business-economy',
    'demographics',
    'immigration'
  ];
begin
  select id into v_listing_id
  from public.marketplace_listings
  where slug = 'census-data-api'
  limit 1;

  if v_listing_id is null then
    raise notice 'Census listing (census-data-api) not found — run 017 seed first, then re-run this migration.';
    return;
  end if;

  foreach v_topic_slug in array v_topic_slugs loop
    insert into public.marketplace_listing_topics (listing_id, topic_id)
    select v_listing_id, t.id
    from public.marketplace_topics t
    where t.slug = v_topic_slug
    on conflict do nothing;
  end loop;

  raise notice 'Assigned % topics to census-data-api listing', array_length(v_topic_slugs, 1);
end $$;
