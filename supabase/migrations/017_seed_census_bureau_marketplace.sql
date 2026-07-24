-- Seed: US Census Bureau as first marketplace listing (vendor_direct)
-- Run in Supabase SQL Editor AFTER apply_marketplace_migrations.sql (014–016).
-- Safe to re-run: uses slug lookups and skips if listing already exists.

do $$
declare
  v_company_id uuid;
  v_api_product_id uuid;
  v_listing_id uuid;
begin
  -- 1. Company (directory + marketplace vendor)
  select id into v_company_id
  from public.companies
  where slug = 'us-census-bureau'
  limit 1;

  if v_company_id is null then
    insert into public.companies (
      name,
      slug,
      description,
      website_url,
      logo_url,
      category,
      subcategory,
      claimed
    ) values (
      'U.S. Census Bureau',
      'us-census-bureau',
      'Official demographic, economic, and geographic statistics for the United States. Provides public APIs for ACS, decennial census, economic surveys, and more.',
      'https://www.census.gov',
      '/census_acs.png',
      'Government',
      'Demographics & Population',
      false
    )
    returning id into v_company_id;
  end if;

  update public.companies set
    logo_url = '/census_acs.png',
    updated_at = now()
  where id = v_company_id and (logo_url is null or logo_url = '');

  -- 2. API product metadata (not proxied — vendor_direct)
  select id into v_api_product_id
  from public.api_products
  where company_id = v_company_id
    and name = 'Census Data API'
  limit 1;

  if v_api_product_id is null then
    insert into public.api_products (
      company_id,
      name,
      base_url,
      docs_url,
      auth_type,
      connector_type,
      pricing_model,
      status
    ) values (
      v_company_id,
      'Census Data API',
      'https://api.census.gov/data',
      'https://www.census.gov/data/developers.html',
      'api_key',
      'rest_apikey',
      'free',
      'published'
    )
    returning id into v_api_product_id;
  else
    update public.api_products set
      base_url = 'https://api.census.gov/data',
      docs_url = 'https://www.census.gov/data/developers.html',
      auth_type = 'api_key',
      pricing_model = 'free',
      status = 'published',
      updated_at = now()
    where id = v_api_product_id;
  end if;

  -- 3. Marketplace listing (vendor_direct = no gateway proxy)
  select id into v_listing_id
  from public.marketplace_listings
  where slug = 'census-data-api'
  limit 1;

  if v_listing_id is null then
    insert into public.marketplace_listings (
      slug,
      company_id,
      api_product_id,
      title,
      tagline,
      description,
      fulfillment_mode,
      license_summary,
      license_version,
      published,
      required_attestations
    ) values (
      'census-data-api',
      v_company_id,
      v_api_product_id,
      'Census Data API',
      'Official U.S. demographic and economic statistics via REST API',
      E'Access American Community Survey, decennial census, and other public datasets from the U.S. Census Bureau.\n\nThis is a vendor-direct listing: Source Signal helps you discover and request access, but API keys and terms are issued by Census. Sign up for a free Census API key at https://api.census.gov/data/key_signup.html\n\nTypical datasets: ACS 1-year and 5-year estimates, population counts, economic indicators.',
      'vendor_direct',
      'Public domain U.S. government data. Subject to Census Bureau terms of use. Not for redistribution as a commercial data product without compliance review.',
      '1.0',
      true,
      array['internal_use_only']
    )
    returning id into v_listing_id;
  else
    update public.marketplace_listings set
      company_id = v_company_id,
      api_product_id = v_api_product_id,
      title = 'Census Data API',
      tagline = 'Official U.S. demographic and economic statistics via REST API',
      fulfillment_mode = 'vendor_direct',
      published = true,
      updated_at = now()
    where id = v_listing_id;
  end if;

  -- 4. Free plan (vendor_direct: "Subscribe" creates a connection request, not Stripe)
  if not exists (
    select 1 from public.marketplace_plans
    where listing_id = v_listing_id and name = 'Public API (free)'
  ) then
    insert into public.marketplace_plans (
      listing_id,
      name,
      price_cents,
      currency,
      interval,
      trial_days,
      quota,
      active
    ) values (
      v_listing_id,
      'Public API (free)',
      0,
      'usd',
      'free',
      0,
      '{"note": "Census API is free; rate limits apply per Census key"}'::jsonb,
      true
    );
  end if;

  raise notice 'Census Bureau marketplace listing ready. Listing slug: census-data-api, company slug: us-census-bureau';
end $$;
