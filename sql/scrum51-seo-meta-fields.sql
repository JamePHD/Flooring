-- SCRUM-51: SEO meta fields for products and categories.
-- Optional admin overrides; frontend falls back to auto-generation when null.

alter table public.products
    add column if not exists meta_title text,
    add column if not exists meta_description text;

alter table public.categories
    add column if not exists meta_title text,
    add column if not exists meta_description text;

-- Length constraints aligned with SEO best practice
-- (Google typically truncates titles around 60 chars and descriptions around 160).
alter table public.products
    add constraint products_meta_title_length
        check (meta_title is null or char_length(meta_title) <= 70),
    add constraint products_meta_description_length
        check (meta_description is null or char_length(meta_description) <= 200);

alter table public.categories
    add constraint categories_meta_title_length
        check (meta_title is null or char_length(meta_title) <= 70),
    add constraint categories_meta_description_length
        check (meta_description is null or char_length(meta_description) <= 200);

comment on column public.products.meta_title is
    'SEO meta title override. Falls back to auto-generated title when null. Recommended max 60 chars (limit 70).';
comment on column public.products.meta_description is
    'SEO meta description override. Falls back to auto-generated description when null. Recommended max 160 chars (limit 200).';
comment on column public.categories.meta_title is
    'SEO meta title override. Falls back to category name when null. Recommended max 60 chars (limit 70).';
comment on column public.categories.meta_description is
    'SEO meta description override. Falls back to category description when null. Recommended max 160 chars (limit 200).';