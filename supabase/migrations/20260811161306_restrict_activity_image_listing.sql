begin;

drop policy activity_images_public_read on storage.objects;

create policy activity_images_admin_select
on storage.objects
for select
to authenticated
using (
    bucket_id = 'activity-images'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

commit;
