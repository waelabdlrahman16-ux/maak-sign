create extension if not exists pg_net;
create extension if not exists pg_cron;
-- every day 08:47 Cairo (06:47 UTC): send the follow-up notifications that are due
select cron.schedule('maak-push-daily', '47 6 * * *', $$
  select net.http_post(
    url := 'https://lkvdivexgzhavuijydsb.supabase.co/functions/v1/maak-push',
    headers := jsonb_build_object('content-type','application/json','x-maak-cron',(select cron_secret from public.push_keys where id = 1)),
    body := '{"op":"send"}'::jsonb,
    timeout_milliseconds := 30000)
$$);
