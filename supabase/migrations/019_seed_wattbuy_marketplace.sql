-- Seed: WattBuy as platform-connected marketplace listing (free)
-- Run in Supabase SQL Editor AFTER 014–018 (and 017 if applying full catalog).
-- Docs: https://wattbuy.readme.io/reference/getting-started-with-your-api
-- Safe to re-run: uses slug lookups and skips if records already exist.

-- Topics for WattBuy discovery
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
  -- 1. Company
  select id into v_company_id
  from public.companies
  where slug = 'wattbuy'
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
      'WattBuy',
      'wattbuy',
      'Personalized power platform APIs for utility lookup, electricity usage and cost estimates, solar sizing, carbon footprint, retail rates, and residential clean-energy incentives.',
      'https://wattbuy.com',
      '/wattbuy.png',
      'Energy',
      'Utilities & Clean Power',
      false
    )
    returning id into v_company_id;
  end if;

  update public.companies set
    logo_url = '/wattbuy.png',
    updated_at = now()
  where id = v_company_id and (logo_url is null or logo_url = '');

  -- 2. API product (proxied via marketplace gateway — platform mode)
  select id into v_api_product_id
  from public.api_products
  where company_id = v_company_id
    and name = 'WattBuy API'
  limit 1;

  if v_api_product_id is null then
    insert into public.api_products (
      company_id,
      name,
      base_url,
      docs_url,
      openapi_url,
      auth_type,
      connector_type,
      pricing_model,
      status
    ) values (
      v_company_id,
      'WattBuy API',
      'https://apis.wattbuy.com/v3',
      'https://wattbuy.readme.io/reference/getting-started-with-your-api',
      'https://wattbuy.readme.io/reference/getting-started-with-your-api',
      'api_key',
      'rest_apikey',
      'free',
      'published'
    )
    returning id into v_api_product_id;
  else
    update public.api_products set
      base_url = 'https://apis.wattbuy.com/v3',
      docs_url = 'https://wattbuy.readme.io/reference/getting-started-with-your-api',
      openapi_url = 'https://wattbuy.readme.io/reference/getting-started-with-your-api',
      auth_type = 'api_key',
      connector_type = 'rest_apikey',
      pricing_model = 'free',
      status = 'published',
      updated_at = now()
    where id = v_api_product_id;
  end if;

  -- 3. Marketplace listing (platform = Source Signal gateway + Stripe Connect vendor)
  select id into v_listing_id
  from public.marketplace_listings
  where slug = 'wattbuy-api'
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
      platform_fee_percent,
      required_attestations
    ) values (
      'wattbuy-api',
      v_company_id,
      v_api_product_id,
      'WattBuy API',
      'Utility, usage, solar, carbon, and green-energy incentive data for U.S. homes',
      E'Access the WattBuy Personalized Power Platform for utility lookup, electricity usage and bill estimates, solar production sizing, carbon footprint, retail and surplus generation rate databases, residential incentive programs, and electricity offers.\n\nGet a free API key from WattBuy (x-api-key header) and call https://apis.wattbuy.com/v3 directly.\n\nDocumentation: https://wattbuy.readme.io/reference/getting-started-with-your-api',
      'vendor_direct',
      'Subject to WattBuy API Terms of Use. For application use via Source Signal marketplace entitlements only.',
      '1.0',
      true,
      0,
      array['internal_use_only']
    )
    returning id into v_listing_id;
  else
    update public.marketplace_listings set
      company_id = v_company_id,
      api_product_id = v_api_product_id,
      title = 'WattBuy API',
      tagline = 'Utility, usage, solar, carbon, and green-energy incentive data for U.S. homes',
      fulfillment_mode = 'vendor_direct',
      published = true,
      platform_fee_percent = 0,
      updated_at = now()
    where id = v_listing_id;
  end if;

  -- 4. Free plan (instant entitlement — no Stripe checkout)
  if not exists (
    select 1 from public.marketplace_plans
    where listing_id = v_listing_id and name = 'Developer (free)'
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
      'Developer (free)',
      0,
      'usd',
      'free',
      0,
      '{"note": "Free WattBuy access via Source Signal gateway; fair-use rate limits apply"}'::jsonb,
      true
    );
  end if;

  -- 5. Topics: Utility + Green Energy
  foreach v_topic_slug in array v_topic_slugs loop
    insert into public.marketplace_listing_topics (listing_id, topic_id)
    select v_listing_id, t.id
    from public.marketplace_topics t
    where t.slug = v_topic_slug
    on conflict do nothing;
  end loop;

  raise notice 'WattBuy marketplace listing ready. Listing slug: wattbuy-api, topics: utility, green-energy';
  raise notice 'Get API keys at https://wattbuy.readme.io/reference/creating-an-account';
end $$;
