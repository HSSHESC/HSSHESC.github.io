begin;

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'site-assets',
    'site-assets',
    true,
    6291456,
    array[
        'image/avif',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]::text[]
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_assets_admin_select on storage.objects;
drop policy if exists site_assets_admin_insert on storage.objects;
drop policy if exists site_assets_admin_update on storage.objects;
drop policy if exists site_assets_admin_delete on storage.objects;

create policy site_assets_admin_select
on storage.objects
for select
to authenticated
using (
    bucket_id = 'site-assets'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy site_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'site-assets'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy site_assets_admin_update
on storage.objects
for update
to authenticated
using (
    bucket_id = 'site-assets'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    bucket_id = 'site-assets'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy site_assets_admin_delete
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'site-assets'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

with normalized as (
    select
        id,
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            content #- '{about,paragraphs}' #- '{about,plans}',
                            '{about,body_markdown}',
                            to_jsonb(
                                coalesce(
                                    content #>> '{about,body_markdown}',
                                    (
                                        select string_agg(value, E'\n\n' order by ordinal)
                                        from jsonb_array_elements_text(
                                            coalesce(content #> '{about,paragraphs}', '[]'::jsonb)
                                        ) with ordinality as paragraph(value, ordinal)
                                    ),
                                    ''
                                )
                            ),
                            true
                        ),
                        '{about,plans_markdown}',
                        to_jsonb(
                            coalesce(
                                content #>> '{about,plans_markdown}',
                                (
                                    select string_agg('- ' || value, E'\n' order by ordinal)
                                    from jsonb_array_elements_text(
                                        coalesce(content #> '{about,plans}', '[]'::jsonb)
                                    ) with ordinality as plan(value, ordinal)
                                ),
                                ''
                            )
                        ),
                        true
                    ),
                    '{branding}',
                    jsonb_build_object(
                        'club_logo_storage_path', 'branding/club-logo.png',
                        'club_logo_alt', 'ESC 동아리 로고',
                        'school_logo_storage_path', 'branding/school-logo.jpg',
                        'school_logo_alt', '한성과학고등학교 로고'
                    ),
                    true
                ),
                '{appearance}',
                jsonb_build_object('contact_overlay_color', '#8b5cf6'),
                true
            ),
            '{contact,items}',
            coalesce(
                (
                    select jsonb_agg(
                        case
                            when item ->> 'icon' = 'bi-github' then
                                jsonb_build_object(
                                    'type', 'github',
                                    'label', 'GitHub',
                                    'text', coalesce(item ->> 'text', 'GitHub'),
                                    'url', coalesce(item ->> 'url', item ->> 'href', ''),
                                    'icon', 'bi-github',
                                    'social', coalesce((item ->> 'social')::boolean, false),
                                    'social_icon', 'bi-github'
                                )
                            else
                                jsonb_build_object(
                                    'type', 'email',
                                    'label', coalesce(item ->> 'label', ''),
                                    'text', coalesce(item ->> 'email', item ->> 'text', ''),
                                    'email', coalesce(item ->> 'email', item ->> 'text', ''),
                                    'icon', 'bi-envelope',
                                    'social', coalesce((item ->> 'social')::boolean, false),
                                    'social_icon', 'bi-envelope'
                                )
                        end
                        order by ordinal
                    )
                    from jsonb_array_elements(
                        coalesce(content #> '{contact,items}', '[]'::jsonb)
                    ) with ordinality as contact_item(item, ordinal)
                ),
                '[]'::jsonb
            ),
            true
        ) as next_content
    from public.site_content
    where id = 'home'
)
update public.site_content
set content = normalized.next_content
from normalized
where site_content.id = normalized.id;

commit;
