-- SCRUM-39 corrections

-- 1. Drop redundant price column on products (price lives on variants)
alter table public.products
    drop column if exists price_per_sqm;

-- 2. Fix slug naming: snake_case → kebab-case to match existing convention
update public.attributes set slug = 'suitable-rooms' where slug = 'suitable_rooms';
update public.attributes set slug = 'pet-friendly' where slug = 'pet_friendly';
update public.attributes set slug = 'kid-friendly' where slug = 'kid_friendly';
update public.attributes set slug = 'scratch-resistant' where slug = 'scratch_resistant';
update public.attributes set slug = 'sound-absorbing' where slug = 'sound_absorbing';
update public.attributes set slug = 'low-voc' where slug = 'low_voc';
update public.attributes set slug = 'durability-rating' where slug = 'durability_rating';

-- 3. Drop the duplicate Waterproof attempt under Performance (if it somehow got created)
delete from public.attributes
where slug = 'waterproof'
  and group_id in (select id from public.attribute_groups where slug = 'performance');