-- SCRUM-68: Multi-file spec sheets per product with labels and ordering.
-- Supersedes the single spec_sheet_url column added in SCRUM-39.

-- ─── New table ───────────────────────────────────────────────

create table public.product_spec_sheets (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    label text not null,
    file_url text not null,
    file_name text,
    file_size_bytes integer,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint product_spec_sheets_label_length
        check (char_length(label) between 1 and 100)
);

-- Common queries: get all sheets for a product, ordered.
create index product_spec_sheets_product_id_idx
    on public.product_spec_sheets (product_id, sort_order, created_at);

create trigger product_spec_sheets_set_updated_at
    before update on public.product_spec_sheets
    for each row
    execute function public.set_updated_at();

-- RLS: public can read, only admins can write (matches storage policy).
alter table public.product_spec_sheets enable row level security;

create policy "Public can view product spec sheets"
    on public.product_spec_sheets for select
    using (true);

create policy "Admins can manage product spec sheets"
    on public.product_spec_sheets for all
    using (
        exists (
            select 1 from public.admin_profiles
            where user_id = auth.uid() and is_active = true
        )
    );

-- ─── Migrate existing data ───────────────────────────────────
-- Any product that already has a spec_sheet_url gets one row in the new table
-- with a default label. Safe if no data exists.

insert into public.product_spec_sheets (product_id, label, file_url, sort_order)
select id, 'Specification Sheet', spec_sheet_url, 0
from public.products
where spec_sheet_url is not null;

-- ─── Drop old column ─────────────────────────────────────────

alter table public.products drop column if exists spec_sheet_url;

comment on table public.product_spec_sheets is
    'Multi-file spec sheets per product (SCRUM-68). One product can have up to 10 spec sheets, each with a free-text label and explicit sort order.';