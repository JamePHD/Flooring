-- SCRUM-39: Schema additions for product recommendations
-- Adds columns to products and seeds attributes used by the recommendation filter.

-- ─── Product columns ─────────────────────────────────────────
-- Intrinsic product fields that don't fit the flexible attribute system.

alter table public.products
    add column if not exists price_per_sqm numeric(10, 2),
    add column if not exists spec_sheet_url text,
    add column if not exists is_residential boolean not null default true,
    add column if not exists is_commercial boolean not null default false;

-- Helpful indexes for the most common filter paths.
create index if not exists products_price_per_sqm_idx
    on public.products (price_per_sqm)
    where price_per_sqm is not null;

create index if not exists products_is_commercial_idx
    on public.products (is_commercial)
    where is_commercial = true;

comment on column public.products.price_per_sqm is
    'Price per square metre. Nullable until pricing data is provided by the client.';
comment on column public.products.spec_sheet_url is
    'URL to product specification sheet PDF. Used by architect/designer recommendations (AC#7).';

-- ─── Attribute groups + attributes ───────────────────────────
-- Seed the attributes the recommendation engine maps qualifying answers to.
-- Uses existing schema from SCRUM-48 (attribute_groups, attributes).

insert into public.attribute_groups (name, slug, sort_order) values
    ('Suitability', 'suitability', 10),
    ('Performance', 'performance', 20),
    ('Durability', 'durability', 30)
on conflict (slug) do nothing;

-- Suitability attributes (which rooms / who it's for)
insert into public.attributes (group_id, name, slug, data_type, sort_order)
select g.id, a.name, a.slug, a.data_type, a.sort_order
from (values
    ('Suitable Rooms', 'suitable_rooms', 'text', 10),
    ('Pet Friendly', 'pet_friendly', 'boolean', 20),
    ('Kid Friendly', 'kid_friendly', 'boolean', 30)
) as a(name, slug, data_type, sort_order)
cross join (select id from public.attribute_groups where slug = 'suitability') g
on conflict (slug) do nothing;

-- Performance attributes (architect path filters)
insert into public.attributes (group_id, name, slug, data_type, sort_order)
select g.id, a.name, a.slug, a.data_type, a.sort_order
from (values
    ('Waterproof', 'waterproof', 'boolean', 10),
    ('Scratch Resistant', 'scratch_resistant', 'boolean', 20),
    ('Sound Absorbing', 'sound_absorbing', 'boolean', 30),
    ('Low VOC', 'low_voc', 'boolean', 40)
) as a(name, slug, data_type, sort_order)
cross join (select id from public.attribute_groups where slug = 'performance') g
on conflict (slug) do nothing;

-- Durability attributes (investor path)
insert into public.attributes (group_id, name, slug, data_type, sort_order)
select g.id, a.name, a.slug, a.data_type, a.sort_order
from (values
    ('Durability Rating', 'durability_rating', 'number', 10)
) as a(name, slug, data_type, sort_order)
cross join (select id from public.attribute_groups where slug = 'durability') g
on conflict (slug) do nothing;