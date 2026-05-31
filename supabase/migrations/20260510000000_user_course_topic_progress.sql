-- Run in Supabase SQL editor if migrations CLI is not used.
-- Progress when user scrolls a course topic page to the bottom.

create table if not exists public.user_course_topic_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null,
  topic_id text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, course_id, topic_id)
);

create index if not exists user_course_topic_progress_user_course_idx
  on public.user_course_topic_progress (user_id, course_id);

alter table public.user_course_topic_progress enable row level security;

create policy "Users read own course progress"
  on public.user_course_topic_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own course progress"
  on public.user_course_topic_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own course progress"
  on public.user_course_topic_progress for update
  using (auth.uid() = user_id);

create policy "Users delete own course progress"
  on public.user_course_topic_progress for delete
  using (auth.uid() = user_id);
