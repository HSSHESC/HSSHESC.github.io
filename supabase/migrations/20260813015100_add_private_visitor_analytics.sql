begin;

-- The file version matches the migration recorded by the hosted project.

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.site_visits (
    visit_date date not null,
    daily_visitor_hash bytea not null,
    month_start date not null,
    monthly_visitor_hash bytea not null,
    first_visited_at timestamptz not null default now(),
    primary key (visit_date, daily_visitor_hash),
    constraint site_visits_month_start_check
        check (month_start = date_trunc('month', visit_date::timestamp)::date)
);

comment on table private.site_visits is
    'Privacy-minimized unique visitor records retained for at most one year.';

create index site_visits_month_hash_idx
    on private.site_visits (month_start, monthly_visitor_hash);

alter table private.site_visits enable row level security;
revoke all on table private.site_visits from public, anon, authenticated;

create or replace function public.record_site_visit(p_visitor_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    visitor_date date := (now() at time zone 'Asia/Seoul')::date;
    visitor_month date;
begin
    if p_visitor_token is null then
        raise exception 'A visitor token is required.'
            using errcode = '22023';
    end if;

    visitor_month := date_trunc('month', visitor_date::timestamp)::date;

    insert into private.site_visits (
        visit_date,
        daily_visitor_hash,
        month_start,
        monthly_visitor_hash
    ) values (
        visitor_date,
        extensions.digest(
            p_visitor_token::text || ':day:' || visitor_date::text,
            'sha256'
        ),
        visitor_month,
        extensions.digest(
            p_visitor_token::text || ':month:' || visitor_month::text,
            'sha256'
        )
    )
    on conflict (visit_date, daily_visitor_hash) do nothing;
end;
$$;

comment on function public.record_site_visit(uuid) is
    'Records one unique browser visit per Korean calendar day without storing the token, IP address, or user agent.';

revoke all on function public.record_site_visit(uuid)
    from public, anon, authenticated;
grant execute on function public.record_site_visit(uuid)
    to anon, authenticated;

create or replace function public.get_site_visitor_stats(
    p_start_date date,
    p_end_date date,
    p_granularity text
)
returns table (
    period_start date,
    visitor_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    today_kst date := (now() at time zone 'Asia/Seoul')::date;
begin
    if not exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    ) then
        raise exception 'Administrator access is required.'
            using errcode = '42501';
    end if;

    if p_start_date is null or p_end_date is null then
        raise exception 'A start date and end date are required.'
            using errcode = '22023';
    end if;

    if p_start_date > p_end_date then
        raise exception 'The start date must not be after the end date.'
            using errcode = '22023';
    end if;

    if p_end_date > today_kst
       or p_start_date < (today_kst - interval '1 year')::date then
        raise exception 'The requested period must be within the retained year.'
            using errcode = '22023';
    end if;

    if p_granularity not in ('day', 'month') then
        raise exception 'Granularity must be day or month.'
            using errcode = '22023';
    end if;

    return query
    with periods as (
        select
            series::date as bucket_start,
            case
                when p_granularity = 'month' then
                    (series + interval '1 month - 1 day')::date
                else series::date
            end as bucket_end
        from generate_series(
            case
                when p_granularity = 'month' then
                    date_trunc('month', p_start_date::timestamp)
                else p_start_date::timestamp
            end,
            case
                when p_granularity = 'month' then
                    date_trunc('month', p_end_date::timestamp)
                else p_end_date::timestamp
            end,
            case
                when p_granularity = 'month' then interval '1 month'
                else interval '1 day'
            end
        ) as series
    )
    select
        periods.bucket_start,
        count(
            distinct case
                when p_granularity = 'month' then visits.monthly_visitor_hash
                else visits.daily_visitor_hash
            end
        )::bigint
    from periods
    left join private.site_visits as visits
        on visits.visit_date between greatest(periods.bucket_start, p_start_date)
        and least(periods.bucket_end, p_end_date)
    group by periods.bucket_start
    order by periods.bucket_start;
end;
$$;

comment on function public.get_site_visitor_stats(date, date, text) is
    'Returns zero-filled daily or monthly unique visitor counts to site administrators for a retained period of up to one year.';

revoke all on function public.get_site_visitor_stats(date, date, text)
    from public, anon, authenticated;
grant execute on function public.get_site_visitor_stats(date, date, text)
    to authenticated;

select cron.schedule(
    'delete-site-visits-older-than-one-year',
    '10 16 * * *',
    $cron$
        delete from private.site_visits
        where visit_date < (
            (now() at time zone 'Asia/Seoul')::date - interval '1 year'
        )::date;

        delete from cron.job_run_details
        where end_time < now() - interval '30 days';
    $cron$
);

commit;
