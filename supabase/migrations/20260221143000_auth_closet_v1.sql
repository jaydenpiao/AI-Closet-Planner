-- Closet Planner AI v2: auth + persistent closet + saved outfits.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create table if not exists public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'other')),
  color text not null,
  material text,
  pattern text,
  formality text not null check (formality in ('casual', 'smart-casual', 'formal', 'athleisure', 'unknown')),
  seasonality text[] not null check (
    array_length(seasonality, 1) >= 1 and
    seasonality <@ array['spring', 'summer', 'fall', 'winter']
  ),
  tags text[] not null default '{}'::text[],
  notes text,
  image_path text,
  image_mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_closet_items_updated_at on public.closet_items;
create trigger set_closet_items_updated_at
before update on public.closet_items
for each row execute procedure public.set_updated_at();

create index if not exists closet_items_user_created_idx
on public.closet_items (user_id, created_at desc);

create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  occasion text not null,
  itinerary text not null,
  outfit_snapshot jsonb not null,
  global_tips text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists saved_outfits_user_created_idx
on public.saved_outfits (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.closet_items enable row level security;
alter table public.saved_outfits enable row level security;

drop policy if exists profiles_owner_select on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
drop policy if exists profiles_owner_delete on public.profiles;

create policy profiles_owner_select
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy profiles_owner_insert
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy profiles_owner_update
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy profiles_owner_delete
on public.profiles
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists closet_items_owner_select on public.closet_items;
drop policy if exists closet_items_owner_insert on public.closet_items;
drop policy if exists closet_items_owner_update on public.closet_items;
drop policy if exists closet_items_owner_delete on public.closet_items;

create policy closet_items_owner_select
on public.closet_items
for select
to authenticated
using (user_id = auth.uid());

create policy closet_items_owner_insert
on public.closet_items
for insert
to authenticated
with check (user_id = auth.uid());

create policy closet_items_owner_update
on public.closet_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy closet_items_owner_delete
on public.closet_items
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists saved_outfits_owner_select on public.saved_outfits;
drop policy if exists saved_outfits_owner_insert on public.saved_outfits;
drop policy if exists saved_outfits_owner_update on public.saved_outfits;
drop policy if exists saved_outfits_owner_delete on public.saved_outfits;

create policy saved_outfits_owner_select
on public.saved_outfits
for select
to authenticated
using (user_id = auth.uid());

create policy saved_outfits_owner_insert
on public.saved_outfits
for insert
to authenticated
with check (user_id = auth.uid());

create policy saved_outfits_owner_update
on public.saved_outfits
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy saved_outfits_owner_delete
on public.saved_outfits
for delete
to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'closet-item-images',
  'closet-item-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists closet_item_images_select on storage.objects;
drop policy if exists closet_item_images_insert on storage.objects;
drop policy if exists closet_item_images_update on storage.objects;
drop policy if exists closet_item_images_delete on storage.objects;

create policy closet_item_images_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'closet-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy closet_item_images_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'closet-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy closet_item_images_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'closet-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'closet-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy closet_item_images_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'closet-item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
