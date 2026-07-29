-- Soft-hide companies from public directory/browse surfaces.
alter table public.companies
  add column if not exists is_active boolean not null default true;

create index if not exists companies_is_active on public.companies (is_active);
