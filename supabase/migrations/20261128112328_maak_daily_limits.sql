-- Maak: daily request limits for the public functions (maak-agent, maak-case, maak-push).
-- One counter per (key, Cairo day). Keys are "<bucket>:<hashed caller>" or "<bucket>:all".
-- No raw addresses are stored. Service role only; pruned after 3 days.

create table if not exists public.rate_hits (
  key text not null check (char_length(key) <= 64),
  day date not null,
  n integer not null default 0,
  primary key (key, day)
);
comment on table public.rate_hits is 'Maak: daily request counters per function (hashed caller + totals). Service role only. Kept 3 days.';

alter table public.rate_hits enable row level security;
revoke all on public.rate_hits from anon, authenticated;

-- Count one call and say whether it is still within the limit.
create or replace function public.rate_hit(p_key text, p_limit integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  insert into public.rate_hits as r (key, day, n)
  values (p_key, (now() at time zone 'Africa/Cairo')::date, 1)
  on conflict (key, day) do update set n = r.n + 1
  returning r.n <= p_limit;
$$;

revoke execute on function public.rate_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rate_hit(text, integer) to service_role;

select cron.schedule(
  'maak-rate-prune',
  '13 3 * * *',
  $$delete from public.rate_hits where day < (now() at time zone 'Africa/Cairo')::date - 3$$
);
