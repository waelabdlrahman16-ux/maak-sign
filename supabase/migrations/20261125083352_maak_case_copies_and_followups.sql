create extension if not exists pgcrypto;
create table if not exists public.case_backups(
  id text primary key check (id ~ '^[0-9a-f]{32}$'),
  iv text not null,
  data text not null check (char_length(data) <= 300000),
  updated_at timestamptz not null default now());
create table if not exists public.push_keys(
  id int primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null,
  cron_secret text not null default encode(gen_random_bytes(24),'hex'));
create table if not exists public.push_jobs(
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  due_date date not null,
  case_ref text not null,
  body text not null check (char_length(body) <= 120),
  sent_at timestamptz,
  created_at timestamptz not null default now());
create index if not exists push_jobs_due on public.push_jobs(due_date) where sent_at is null;
alter table public.case_backups enable row level security;
alter table public.push_keys enable row level security;
alter table public.push_jobs enable row level security;
revoke all on public.case_backups, public.push_keys, public.push_jobs from anon, authenticated;
comment on table public.case_backups is 'Maak: locked case copies. Only ciphertext; the key is a code only the customer holds. Access only through the maak-case function.';
comment on table public.push_keys is 'Maak: web push signing keys and daily job secret. Service role only.';
comment on table public.push_jobs is 'Maak: follow-up notifications. Push endpoint, date, random case id, generic text. No personal data.';
