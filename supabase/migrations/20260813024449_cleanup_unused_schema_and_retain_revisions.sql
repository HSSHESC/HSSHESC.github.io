begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Monthly statistics now sum daily counts, so only the daily privacy hash is
-- needed. ON CONFLICT is intentionally handled as an exception because the
-- anonymous role cannot select the conflicting row under RLS.
create or replace function public.record_site_visit(p_visitor_token uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    visitor_date date := (now() at time zone 'Asia/Seoul')::date;
begin
    if p_visitor_token is null then
        raise exception 'A visitor token is required.'
            using errcode = '22023';
    end if;

    begin
        insert into private.site_visits (
            visit_date,
            daily_visitor_hash
        ) values (
            visitor_date,
            extensions.digest(
                p_visitor_token::text || ':day:' || visitor_date::text,
                'sha256'
            )
        );
    exception
        when unique_violation then
            null;
    end;
end;
$$;

comment on function public.record_site_visit(uuid) is
    'Records one unique browser visit per Korean calendar day without storing the token, IP address, or user agent.';

revoke all on function public.record_site_visit(uuid)
    from public, anon, authenticated;
grant execute on function public.record_site_visit(uuid)
    to anon, authenticated;

drop index if exists private.site_visits_month_hash_idx;

alter table private.site_visits
    drop constraint if exists site_visits_month_start_check,
    drop column if exists month_start,
    drop column if exists monthly_visitor_hash,
    drop column if exists first_visited_at;

-- These indexes have no matching application query. Keep the chronological
-- revision index because it serves both the administrator list and cleanup.
drop index if exists public.activities_tags_idx;
drop index if exists public.content_revisions_entity_created_idx;

comment on table public.content_revisions is
    'Administrator-only snapshots captured before activities or site content change and retained for up to three days.';

delete from public.content_revisions
where created_at < now() - interval '3 days';

select cron.unschedule(jobid)
from cron.job
where jobname = 'delete-content-revisions-older-than-three-days';

select cron.schedule(
    'delete-content-revisions-older-than-three-days',
    '17 * * * *',
    $cron$
        delete from public.content_revisions
        where created_at < now() - interval '3 days';
    $cron$
);

commit;
