begin;

drop policy activities_select_published on public.activities;
drop policy activities_select_admin on public.activities;

create policy activities_select_published
on public.activities
for select
to anon
using (is_published);

create policy activities_select_authenticated
on public.activities
for select
to authenticated
using (
    is_published
    or exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

drop policy activity_photos_select_published on public.activity_photos;
drop policy activity_photos_select_admin on public.activity_photos;

create policy activity_photos_select_published
on public.activity_photos
for select
to anon
using (
    exists (
        select 1
        from public.activities
        where activities.id = activity_photos.activity_id
          and activities.is_published
    )
);

create policy activity_photos_select_authenticated
on public.activity_photos
for select
to authenticated
using (
    exists (
        select 1
        from public.activities
        where activities.id = activity_photos.activity_id
          and activities.is_published
    )
    or exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

commit;
