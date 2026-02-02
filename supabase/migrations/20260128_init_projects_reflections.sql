-- Projects + Reflections schema for "my-design-rasa"

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  image_url text not null
);

-- Reflections table
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects (id) on delete cascade,
  lexicons text[] not null default '{}'::text[],
  explanation text not null default '',
  image_url text not null
);

-- RLS
alter table public.projects enable row level security;
alter table public.reflections enable row level security;

-- Projects policies
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using (user_id = auth.uid());

-- Reflections policies (via owning project)
drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own"
on public.reflections
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = reflections.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own"
on public.reflections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = reflections.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own"
on public.reflections
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = reflections.project_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = reflections.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "reflections_delete_own" on public.reflections;
create policy "reflections_delete_own"
on public.reflections
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = reflections.project_id
      and p.user_id = auth.uid()
  )
);

