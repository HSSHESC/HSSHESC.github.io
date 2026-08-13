begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Visitors may record only today's derived daily hash through this narrowly
-- scoped function. Client roles no longer receive direct private-table access.
create or replace function public.record_site_visit(p_visitor_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    visitor_date date := (now() at time zone 'Asia/Seoul')::date;
begin
    if p_visitor_token is null then
        raise exception 'A visitor token is required.'
            using errcode = '22023';
    end if;

    insert into private.site_visits (
        visit_date,
        daily_visitor_hash
    ) values (
        visitor_date,
        extensions.digest(
            p_visitor_token::text || ':day:' || visitor_date::text,
            'sha256'
        )
    )
    on conflict (visit_date, daily_visitor_hash) do nothing;
end;
$$;

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
    with daily_counts as (
        select
            visits.visit_date,
            count(*)::bigint as daily_visitor_count
        from private.site_visits as visits
        where visits.visit_date between p_start_date and p_end_date
        group by visits.visit_date
    ),
    periods as (
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
        coalesce(sum(daily_counts.daily_visitor_count), 0)::bigint
    from periods
    left join daily_counts
        on daily_counts.visit_date between greatest(
            periods.bucket_start,
            p_start_date
        ) and least(periods.bucket_end, p_end_date)
    group by periods.bucket_start
    order by periods.bucket_start;
end;
$$;

revoke all on function public.record_site_visit(uuid)
    from public, anon, authenticated;
grant execute on function public.record_site_visit(uuid)
    to anon, authenticated;

revoke all on function public.get_site_visitor_stats(date, date, text)
    from public, anon, authenticated;
grant execute on function public.get_site_visitor_stats(date, date, text)
    to authenticated;

drop policy if exists site_visits_insert_tracking
    on private.site_visits;
drop policy if exists site_visits_select_admin
    on private.site_visits;
revoke all on table private.site_visits from anon, authenticated;
revoke all on schema private from anon, authenticated;

-- Public clients receive only fields needed to render the public site. Internal
-- author UUIDs and audit timestamps remain unavailable through the Data API.
revoke select on table public.activities from anon, authenticated;
grant select (
    id,
    title,
    description,
    activity_date,
    external_url,
    icon,
    is_published,
    activity_type,
    tags,
    created_at
) on table public.activities to anon, authenticated;

revoke select on table public.activity_photos from anon, authenticated;
grant select (
    id,
    activity_id,
    storage_path,
    caption,
    display_order,
    created_at
) on table public.activity_photos to anon, authenticated;

revoke select on table public.activity_types from anon, authenticated;
grant select (
    slug,
    label,
    display_order
) on table public.activity_types to anon, authenticated;

revoke select on table public.site_content from anon, authenticated;
grant select (id, content) on table public.site_content to anon;
grant select (id, content, updated_at)
    on table public.site_content to authenticated;

revoke select on table public.site_admins from authenticated;
grant select (user_id) on table public.site_admins to authenticated;

revoke select on table public.content_revisions from authenticated;
grant select (
    id,
    entity_type,
    entity_id,
    snapshot,
    created_at
) on table public.content_revisions to authenticated;

commit;
