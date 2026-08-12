begin;

alter table public.activity_photos
    drop constraint activity_photos_one_source_check,
    drop constraint activity_photos_image_url_check,
    drop constraint activity_photos_storage_path_check,
    alter column storage_path set not null,
    drop column image_url,
    add constraint activity_photos_storage_path_check
        check (
            char_length(btrim(storage_path)) between 1 and 500
            and storage_path !~ '(^|/)\.\.(/|$)'
            and split_part(storage_path, '/', 1) = activity_id::text
        );

comment on column public.activity_photos.storage_path is
    'Path in the private activity-images bucket; the first folder is the activity UUID.';

commit;
