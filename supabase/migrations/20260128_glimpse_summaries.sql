-- Glimpse summaries: one row per user, keyed by reflection set so we only regenerate when images change

create table if not exists public.glimpse_summaries (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reflection_ids_key text not null default '',
  summary text not null default '',
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.glimpse_summaries enable row level security;

drop policy if exists "glimpse_summaries_select_own" on public.glimpse_summaries;
create policy "glimpse_summaries_select_own"
on public.glimpse_summaries
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "glimpse_summaries_insert_own" on public.glimpse_summaries;
create policy "glimpse_summaries_insert_own"
on public.glimpse_summaries
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "glimpse_summaries_update_own" on public.glimpse_summaries;
create policy "glimpse_summaries_update_own"
on public.glimpse_summaries
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
