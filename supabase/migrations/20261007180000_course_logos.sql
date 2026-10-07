-- Course logo images (catalog card) via Supabase Storage.

alter table public.courses
  add column if not exists logo_url text;

comment on column public.courses.logo_url is
  'Public URL for course logo image; when null, catalog falls back to icon';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-logos',
  'course-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for catalog cards
drop policy if exists "Public read course logos" on storage.objects;
create policy "Public read course logos"
  on storage.objects for select
  to public
  using (bucket_id = 'course-logos');

-- Writes go through service-role API only (no authenticated storage insert policy)
