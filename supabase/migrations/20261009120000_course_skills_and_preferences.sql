-- Skills taxonomy, per-course skill weights, and dashboard track preference.

create table if not exists public.skills (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint skills_id_format check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.course_skills (
  course_id text not null references public.courses (id) on delete cascade,
  skill_id text not null references public.skills (id) on delete cascade,
  weight numeric not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  primary key (course_id, skill_id)
);

create index if not exists course_skills_skill_id_idx
  on public.course_skills (skill_id);

create table if not exists public.user_dashboard_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  selected_track_id text not null,
  updated_at timestamptz not null default now()
);

comment on table public.skills is
  'Canonical skill labels used as radar axes for career tracks';
comment on table public.course_skills is
  'Skills taught by a course with relative weight for completion aggregation';
comment on table public.user_dashboard_preferences is
  'Per-user dashboard settings; selected_track_id is a career track id from app code';

alter table public.skills enable row level security;
alter table public.course_skills enable row level security;
alter table public.user_dashboard_preferences enable row level security;

-- skills: authenticated read; ADMIN write
create policy "Authenticated users read skills"
  on public.skills for select
  to authenticated
  using (true);

create policy "ADMIN users insert skills"
  on public.skills for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users update skills"
  on public.skills for update
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

create policy "ADMIN users delete skills"
  on public.skills for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

-- course_skills: authenticated read; ADMIN write
create policy "Authenticated users read course skills"
  on public.course_skills for select
  to authenticated
  using (true);

create policy "ADMIN users insert course skills"
  on public.course_skills for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

create policy "ADMIN users update course skills"
  on public.course_skills for update
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

create policy "ADMIN users delete course skills"
  on public.course_skills for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_memberships um
      where um.user_id = auth.uid()
        and upper(trim(um.membership)) = 'ADMIN'
    )
  );

-- preferences: own row only
create policy "Users read own dashboard preferences"
  on public.user_dashboard_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own dashboard preferences"
  on public.user_dashboard_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own dashboard preferences"
  on public.user_dashboard_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Seed skills + weights for existing catalog courses (SOC Analyst track)
insert into public.skills (id, name) values
  ('triage', 'Triage'),
  ('log-analysis', 'Log Analysis'),
  ('siem', 'SIEM'),
  ('threat-lifecycle', 'Threat Lifecycle'),
  ('soc-operations', 'SOC Operations'),
  ('detection', 'Detection'),
  ('orchestration', 'Orchestration'),
  ('platform-ops', 'Platform Ops'),
  ('reliability', 'Reliability')
on conflict (id) do nothing;

insert into public.course_skills (course_id, skill_id, weight) values
  ('soc-fundamentals', 'triage', 2),
  ('soc-fundamentals', 'log-analysis', 2),
  ('soc-fundamentals', 'siem', 1),
  ('soc-fundamentals', 'threat-lifecycle', 1.5),
  ('soc-fundamentals', 'soc-operations', 1),
  ('securonix-siem', 'siem', 3),
  ('securonix-siem', 'detection', 2),
  ('securonix-siem', 'orchestration', 1.5),
  ('securonix-siem', 'platform-ops', 1),
  ('securonix-siem', 'reliability', 1)
on conflict (course_id, skill_id) do nothing;
