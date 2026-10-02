-- BlockNote lesson bodies per course topic. Structure (routes/sidebar) stays in app code.

create table if not exists public.course_topic_documents (
  course_id text not null,
  topic_id text not null,
  blocks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (course_id, topic_id)
);

create index if not exists course_topic_documents_updated_at_idx
  on public.course_topic_documents (updated_at desc);

comment on table public.course_topic_documents is
  'BlockNote JSON documents for LMS lesson bodies; editors are user_memberships.membership = ADMIN';

alter table public.course_topic_documents enable row level security;

-- Readers: any authenticated user can load lesson documents
create policy "Authenticated users read course topic documents"
  on public.course_topic_documents for select
  to authenticated
  using (true);

-- Writers: membership ADMIN (expiry ignored for ADMIN accounts)
create policy "ADMIN users insert course topic documents"
  on public.course_topic_documents for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users update course topic documents"
  on public.course_topic_documents for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1
      from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users delete course topic documents"
  on public.course_topic_documents for delete
  to authenticated
  using (
    exists (
      select 1
      from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

-- Seed content: after applying this migration, either
-- 1) Open any lesson (client falls back to shared/courses/blocknote-seed-documents.ts), or
-- 2) As an ADMIN user, POST /api/course-topics/seed to persist all seed documents.
-- Then set an ops account: UPDATE user_memberships SET membership = 'ADMIN' WHERE user_id = '...';
