-- Lesson images inserted from the BlockNote image block.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-images',
  'course-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read so saved image URLs render in lessons
drop policy if exists "Public read course images" on storage.objects;
create policy "Public read course images"
  on storage.objects for select
  to public
  using (bucket_id = 'course-images');

-- Writes go through service-role API only (no authenticated storage insert policy)
