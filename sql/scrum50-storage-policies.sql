-- SCRUM-50: Storage policies for product-spec-sheets bucket
-- Public can read, only admins can write/delete.

-- Public read access (the bucket is public, but explicit policy for clarity)
create policy "Public can view product spec sheets"
on storage.objects for select
using (bucket_id = 'product-spec-sheets');

-- Admin write access
create policy "Admins can upload product spec sheets"
on storage.objects for insert
with check (
    bucket_id = 'product-spec-sheets'
    and exists (
        select 1 from public.admin_profiles
        where user_id = auth.uid() and is_active = true
    )
);

create policy "Admins can update product spec sheets"
on storage.objects for update
using (
    bucket_id = 'product-spec-sheets'
    and exists (
        select 1 from public.admin_profiles
        where user_id = auth.uid() and is_active = true
    )
);

create policy "Admins can delete product spec sheets"
on storage.objects for delete
using (
    bucket_id = 'product-spec-sheets'
    and exists (
        select 1 from public.admin_profiles
        where user_id = auth.uid() and is_active = true
    )
);