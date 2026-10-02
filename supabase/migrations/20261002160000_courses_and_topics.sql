-- Courses + topics for left sidebar / catalog (ADMIN-managed).
-- Lesson bodies remain in course_topic_documents.

create table if not exists public.courses (
  id text primary key,
  title text not null,
  description text not null default '',
  focus_area text not null default 'Security Operations',
  skill_level text not null default 'Beginner',
  icon text not null default 'ri-book-open-line',
  students_label text not null default '0 students',
  duration_hours integer not null default 0,
  modules integer not null default 0,
  lessons integer not null default 0,
  instructor_name text not null default 'SOC Academy',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_topics (
  course_id text not null references public.courses (id) on delete cascade,
  topic_id text not null,
  title text not null,
  sort_order integer not null default 0,
  paid_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (course_id, topic_id),
  constraint course_topics_topic_id_format check (topic_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists courses_sort_order_idx on public.courses (sort_order, title);
create index if not exists course_topics_sort_order_idx
  on public.course_topics (course_id, sort_order, topic_id);

comment on table public.courses is
  'LMS courses shown on /courses and in course sidebars; ADMIN write';
comment on table public.course_topics is
  'Per-course topic list for left sidebar; ADMIN write. Paths = /courses/{course_id} or /courses/{course_id}/{topic_id}';

alter table public.courses enable row level security;
alter table public.course_topics enable row level security;

-- Readers: authenticated users see published courses/topics
create policy "Authenticated users read published courses"
  on public.courses for select
  to authenticated
  using (
    published = true
    or exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "Authenticated users read course topics"
  on public.course_topics for select
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          c.published = true
          or exists (
            select 1 from public.user_memberships um
            where um.user_id = auth.uid()
              and upper(trim(um.membership)) = 'ADMIN'
          )
        )
    )
  );

create policy "ADMIN users insert courses"
  on public.courses for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users update courses"
  on public.courses for update
  to authenticated
  using (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users delete courses"
  on public.courses for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users insert course topics"
  on public.course_topics for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users update course topics"
  on public.course_topics for update
  to authenticated
  using (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users delete course topics"
  on public.course_topics for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

-- Seed existing catalog courses + topics (idempotent)
insert into public.courses (
  id, title, description, focus_area, skill_level, icon,
  students_label, duration_hours, modules, lessons, instructor_name, sort_order, published
) values
  (
    'soc-fundamentals',
    'SOC Fundamentals',
    'Core security operations concepts: roles, threat lifecycle, triage, SIEM basics, and log analysis for day-one analysts.',
    'Security Operations',
    'Beginner',
    'ri-graduation-cap-fill',
    '2.4K students',
    6, 6, 28,
    'SOC Academy',
    10,
    true
  ),
  (
    'securonix-siem',
    'Securonix SIEM',
    'Platform architecture, tenant activation, UI tour, AI agents, and Hub installation to operate Securonix in production.',
    'SIEM',
    'Intermediate',
    'ri-radar-fill',
    '1.1K students',
    9, 6, 42,
    'Securonix Lab',
    20,
    true
  )
on conflict (id) do nothing;

insert into public.course_topics (course_id, topic_id, title, sort_order, paid_only) values
  ('soc-fundamentals', 'overview', 'Overview', 10, false),
  ('soc-fundamentals', 'soc-roles', 'SOC Roles & Responsibilities', 20, false),
  ('soc-fundamentals', 'threat-lifecycle', 'Threat Lifecycle', 30, false),
  ('soc-fundamentals', 'incident-triage', 'Incident Triage', 40, false),
  ('soc-fundamentals', 'siem-fundamentals', 'SIEM Fundamentals', 50, false),
  ('soc-fundamentals', 'log-analysis', 'Log Analysis Basics', 60, false),
  ('securonix-siem', 'overview', 'Securonix SIEM Overview', 10, false),
  ('securonix-siem', 'architecture', 'Securonix Architecture', 20, false),
  ('securonix-siem', 'tenant-activation', 'Tenant Activation by Securonix', 30, false),
  ('securonix-siem', 'ui-tour', 'Securonix UI Tour', 40, false),
  ('securonix-siem', 'ai-agents', 'Securonix AI Agents', 50, false),
  ('securonix-siem', 'hub-installation', 'Securonix Hub Installation', 60, false)
on conflict (course_id, topic_id) do nothing;
