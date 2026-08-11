begin;

create table public.site_admins (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

comment on table public.site_admins is
    'Supabase Auth users who may manage ESC website activities.';

create table public.activities (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null default '',
    activity_date date not null,
    external_url text,
    icon text not null default 'bi-stars',
    is_published boolean not null default true,
    created_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint activities_title_length_check
        check (char_length(btrim(title)) between 1 and 120),
    constraint activities_description_length_check
        check (char_length(description) <= 5000),
    constraint activities_external_url_check
        check (external_url is null or external_url ~ '^https?://'),
    constraint activities_icon_check
        check (icon ~ '^bi-[a-z0-9-]+$')
);

comment on table public.activities is
    'ESC activities shown on the public portfolio and managed by site admins.';

create table public.activity_photos (
    id uuid primary key default gen_random_uuid(),
    activity_id uuid not null references public.activities (id) on delete cascade,
    storage_path text unique,
    image_url text,
    caption text not null default '',
    display_order integer not null default 0,
    created_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint activity_photos_one_source_check
        check ((storage_path is null) <> (image_url is null)),
    constraint activity_photos_storage_path_check
        check (
            storage_path is null
            or (
                char_length(btrim(storage_path)) between 1 and 500
                and storage_path !~ '(^|/)\.\.(/|$)'
            )
        ),
    constraint activity_photos_image_url_check
        check (
            image_url is null
            or image_url ~ '^(https?://|assets/)'
        ),
    constraint activity_photos_caption_length_check
        check (char_length(caption) <= 500),
    constraint activity_photos_display_order_check
        check (display_order >= 0)
);

comment on table public.activity_photos is
    'Ordered activity images and their individual captions.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

create trigger activity_photos_set_updated_at
before update on public.activity_photos
for each row execute function public.set_updated_at();

create index activities_published_date_idx
    on public.activities (activity_date desc, created_at desc)
    where is_published;

create index activities_created_by_idx
    on public.activities (created_by)
    where created_by is not null;

create index activity_photos_activity_order_idx
    on public.activity_photos (activity_id, display_order, created_at);

create index activity_photos_created_by_idx
    on public.activity_photos (created_by)
    where created_by is not null;

alter table public.site_admins enable row level security;
alter table public.activities enable row level security;
alter table public.activity_photos enable row level security;

create policy site_admins_select_self
on public.site_admins
for select
to authenticated
using (user_id = (select auth.uid()));

create policy activities_select_published
on public.activities
for select
to anon, authenticated
using (is_published);

create policy activities_select_admin
on public.activities
for select
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activities_insert_admin
on public.activities
for insert
to authenticated
with check (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activities_update_admin
on public.activities
for update
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activities_delete_admin
on public.activities
for delete
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activity_photos_select_published
on public.activity_photos
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.activities
        where activities.id = activity_photos.activity_id
          and activities.is_published
    )
);

create policy activity_photos_select_admin
on public.activity_photos
for select
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activity_photos_insert_admin
on public.activity_photos
for insert
to authenticated
with check (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activity_photos_update_admin
on public.activity_photos
for update
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

create policy activity_photos_delete_admin
on public.activity_photos
for delete
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

revoke all on table public.site_admins from public, anon, authenticated;
revoke all on table public.activities from public, anon, authenticated;
revoke all on table public.activity_photos from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.site_admins to authenticated;
grant select on table public.activities to anon;
grant select, insert, update, delete on table public.activities to authenticated;
grant select on table public.activity_photos to anon;
grant select, insert, update, delete on table public.activity_photos to authenticated;

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'activity-images',
    'activity-images',
    true,
    6291456,
    array[
        'image/avif',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy activity_images_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'activity-images');

create policy activity_images_admin_insert
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'activity-images'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
    and exists (
        select 1
        from public.activities
        where activities.id::text = (storage.foldername(name))[1]
    )
);

create policy activity_images_admin_update
on storage.objects
for update
to authenticated
using (
    bucket_id = 'activity-images'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
)
with check (
    bucket_id = 'activity-images'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
    and exists (
        select 1
        from public.activities
        where activities.id::text = (storage.foldername(name))[1]
    )
);

create policy activity_images_admin_delete
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'activity-images'
    and exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

insert into public.activities (
    id,
    title,
    description,
    activity_date,
    external_url,
    icon,
    is_published
)
values
    (
        '10000000-0000-4000-8000-000000000001',
        '2026 수학과학체험전',
        '중학생 대상 수학과학체험전 활동을 기획하고 운영',
        '2026-05-21',
        'https://github.com/HSSHESC/sugwachae_2026',
        'bi-mortarboard-fill',
        true
    ),
    (
        '10000000-0000-4000-8000-000000000002',
        '2026 동아리 박람회',
        '작년 활동을 신입생들에게 소개하는 동아리 박람회에서 부스 운영',
        '2026-03-05',
        null,
        'bi-people-fill',
        true
    ),
    (
        '10000000-0000-4000-8000-000000000003',
        '2025 한어울제',
        'LoL 정글 위치 예측 프로그램, 리듬 게임, 모자이크, 3D 체스를 개발하여 부스 운영',
        '2025-12-24',
        'https://2025haneuljae-static.vercel.app/',
        'bi-shop-window',
        true
    ),
    (
        '10000000-0000-4000-8000-000000000004',
        '2025 서울학생 AI개발 성과발표회',
        '2025 서울학생 AI개발 성과발표회에서 동상과 인기상 수상',
        '2025-12-22',
        'https://github.com/HSSHESC/enemy-jungle-locator',
        'bi-robot',
        true
    ),
    (
        '10000000-0000-4000-8000-000000000005',
        '2025 수학과학체험전',
        '중학생 대상 수학과학체험전 활동을 기획하고 운영',
        '2025-05-29',
        'https://github.com/HSSHESC/sugwachae_2025',
        'bi-mortarboard-fill',
        true
    ),
    (
        '10000000-0000-4000-8000-000000000006',
        '2025 동아리 박람회',
        'ESC 활동을 신입생들에게 소개하는 동아리 박람회 운영',
        '2025-03-06',
        null,
        'bi-people-fill',
        true
    )
on conflict (id) do nothing;

insert into public.activity_photos (
    id,
    activity_id,
    image_url,
    caption,
    display_order
)
values
    (
        '20000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000001',
        'https://hsshesc.github.io/assets/img/2026-05-21/2026-05-21%20(1).png',
        '2026 수학과학체험전 활동 사진 1',
        0
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000001',
        'https://hsshesc.github.io/assets/img/2026-05-21/2026-05-21%20(2).png',
        '2026 수학과학체험전 활동 사진 2',
        1
    ),
    (
        '20000000-0000-4000-8000-000000000003',
        '10000000-0000-4000-8000-000000000001',
        'https://hsshesc.github.io/assets/img/2026-05-21/2026-05-21%20(3).png',
        '2026 수학과학체험전 활동 사진 3',
        2
    ),
    (
        '20000000-0000-4000-8000-000000000004',
        '10000000-0000-4000-8000-000000000002',
        'https://hsshesc.github.io/assets/img/2026-03-05/2026-03-05.png',
        '2026 동아리 박람회 활동 사진',
        0
    ),
    (
        '20000000-0000-4000-8000-000000000005',
        '10000000-0000-4000-8000-000000000003',
        'https://hsshesc.github.io/assets/img/2025-12-24/2025-12-24.png',
        '2025 한어울제 활동 사진 1',
        0
    ),
    (
        '20000000-0000-4000-8000-000000000006',
        '10000000-0000-4000-8000-000000000003',
        'https://hsshesc.github.io/assets/img/2025-12-24/2025-12-24%20(2).png',
        '2025 한어울제 활동 사진 2',
        1
    ),
    (
        '20000000-0000-4000-8000-000000000007',
        '10000000-0000-4000-8000-000000000003',
        'https://hsshesc.github.io/assets/img/2025-12-24/2025-12-24%20(3).png',
        '2025 한어울제 활동 사진 3',
        2
    ),
    (
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000004',
        'https://hsshesc.github.io/assets/img/2025-12-22/2025-12-22.jpg',
        '2025 서울학생 AI개발 성과발표회 활동 사진 1',
        0
    ),
    (
        '20000000-0000-4000-8000-000000000009',
        '10000000-0000-4000-8000-000000000004',
        'https://hsshesc.github.io/assets/img/2025-12-22/2025-12-22%20(2).png',
        '2025 서울학생 AI개발 성과발표회 활동 사진 2',
        1
    ),
    (
        '20000000-0000-4000-8000-000000000010',
        '10000000-0000-4000-8000-000000000004',
        'https://hsshesc.github.io/assets/img/2025-12-22/2025-12-22%20(3).png',
        '2025 서울학생 AI개발 성과발표회 활동 사진 3',
        2
    ),
    (
        '20000000-0000-4000-8000-000000000011',
        '10000000-0000-4000-8000-000000000005',
        'https://hsshesc.github.io/assets/img/2025-05-29/2025-05-29.png',
        '2025 수학과학체험전 활동 사진',
        0
    ),
    (
        '20000000-0000-4000-8000-000000000012',
        '10000000-0000-4000-8000-000000000006',
        'https://hsshesc.github.io/assets/img/2025-03-06/2025-03-06.png',
        '2025 동아리 박람회 활동 사진',
        0
    )
on conflict (id) do nothing;

commit;
