create table public.recordings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session text not null check (char_length(session) between 4 and 16),
  sign text not null check (sign ~ '^[a-z0-9_]{1,30}$'),
  rep smallint not null check (rep between 1 and 10),
  features jsonb not null check (jsonb_typeof(features) = 'array' and jsonb_array_length(features) between 8 and 64 and pg_column_size(features) < 60000),
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) < 2000)
);
comment on table public.recordings is 'Maak Sign volunteer recordings: hand/body landmark features only (no video, no face). Insert-only for the public recorder.';
alter table public.recordings enable row level security;
create policy "recorder can insert" on public.recordings for insert to anon with check (true);
revoke all on public.recordings from anon, authenticated;
grant insert on public.recordings to anon;
