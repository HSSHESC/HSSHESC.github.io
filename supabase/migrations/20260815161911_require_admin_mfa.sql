begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Keep the self-only site_admins lookup available at AAL1 so a password-authenticated
-- administrator can be routed to MFA enrollment. Every content-management privilege
-- below requires an AAL2 JWT issued after a verified second factor.
alter policy activities_select_authenticated
on public.activities
using (
    is_published
    or (
        (select auth.jwt() ->> 'aal') = 'aal2'
        and exists (
            select 1
            from public.site_admins
            where site_admins.user_id = (select auth.uid())
        )
    )
);

alter policy activities_insert_admin
on public.activities
with check (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activities_update_admin
on public.activities
using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activities_delete_admin
on public.activities
using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activity_photos_select_authenticated
on public.activity_photos
using (
    exists (
        select 1
        from public.activities
        where activities.id = activity_photos.activity_id
          and activities.is_published
    )
    or (
        (select auth.jwt() ->> 'aal') = 'aal2'
        and exists (
            select 1
            from public.site_admins
            where site_admins.user_id = (select auth.uid())
        )
    )
);

alter policy activity_photos_insert_admin
on public.activity_photos
with check (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activity_photos_update_admin
on public.activity_photos
using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activity_photos_delete_admin
on public.activity_photos
using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activity_types_insert_admin
on public.activity_types
with check (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy content_revisions_select_admin
on public.content_revisions
using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy site_content_insert_admin
on public.site_content
with check (
    updated_by = (select auth.uid())
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy site_content_update_admin
on public.site_content
using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    updated_by = (select auth.uid())
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy activity_images_select_authenticated
on storage.objects
using (
    bucket_id = 'activity-images'
    and (
        exists (
            select 1
            from public.activities
            where activities.id::text = (storage.foldername(objects.name))[1]
              and activities.is_published
        )
        or (
            (select auth.jwt() ->> 'aal') = 'aal2'
            and exists (
                select 1
                from public.site_admins
                where site_admins.user_id = (select auth.uid())
            )
        )
    )
);

alter policy activity_images_admin_insert
on storage.objects
with check (
    bucket_id = 'activity-images'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
    and exists (
        select 1
        from public.activities
        where activities.id::text = (storage.foldername(objects.name))[1]
    )
);

alter policy activity_images_admin_update
on storage.objects
using (
    bucket_id = 'activity-images'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    bucket_id = 'activity-images'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
    and exists (
        select 1
        from public.activities
        where activities.id::text = (storage.foldername(objects.name))[1]
    )
);

alter policy activity_images_admin_delete
on storage.objects
using (
    bucket_id = 'activity-images'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy site_assets_admin_select
on storage.objects
using (
    bucket_id = 'site-assets'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy site_assets_admin_insert
on storage.objects
with check (
    bucket_id = 'site-assets'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy site_assets_admin_update
on storage.objects
using (
    bucket_id = 'site-assets'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    bucket_id = 'site-assets'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

alter policy site_assets_admin_delete
on storage.objects
using (
    bucket_id = 'site-assets'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

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
    if coalesce((select auth.jwt() ->> 'aal'), '') <> 'aal2' then
        raise exception 'Multi-factor authentication is required.'
            using errcode = '42501';
    end if;

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

revoke all on function public.get_site_visitor_stats(date, date, text)
    from public, anon, authenticated;
grant execute on function public.get_site_visitor_stats(date, date, text)
    to authenticated;

commit;
