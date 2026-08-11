begin;

update storage.buckets
set public = false
where id = 'activity-images';

drop policy if exists activity_images_admin_select on storage.objects;
drop policy if exists activity_images_select_authorized on storage.objects;

create policy activity_images_select_authorized
on storage.objects
for select
to anon, authenticated
using (
    bucket_id = 'activity-images'
    and (
        exists (
            select 1
            from public.activities
            where activities.id::text = (storage.foldername(name))[1]
              and activities.is_published
        )
        or exists (
            select 1
            from public.site_admins
            where site_admins.user_id = (select auth.uid())
        )
    )
);

commit;
