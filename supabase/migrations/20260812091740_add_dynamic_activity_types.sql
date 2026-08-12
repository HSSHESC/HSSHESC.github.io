begin;

-- Keep the administrator dropdown and public activity labels in one data source.

create table public.activity_types (
    slug text primary key default ('custom-' || gen_random_uuid()::text),
    label text not null,
    display_order integer not null default 1000,
    created_at timestamptz not null default now(),
    constraint activity_types_slug_format_check
        check (slug ~ '^[a-z0-9][a-z0-9-]{0,70}$'),
    constraint activity_types_label_length_check
        check (char_length(btrim(label)) between 1 and 50),
    constraint activity_types_label_trimmed_check
        check (label = btrim(label)),
    constraint activity_types_display_order_check
        check (display_order >= 0)
);

comment on table public.activity_types is
    'Activity type choices shown in the administrator editor and public portfolio.';

create unique index activity_types_label_lower_idx
    on public.activity_types (lower(label));

create index activity_types_order_label_idx
    on public.activity_types (display_order, label);

insert into public.activity_types (slug, label, display_order)
values
    ('project', '프로젝트', 10),
    ('education', '교육', 20),
    ('festival', '축제', 30),
    ('exchange', '교류', 40),
    ('competition', '대회', 50),
    ('other', '기타', 60);

alter table public.activities
    drop constraint if exists activities_type_check;

alter table public.activities
    drop constraint if exists activities_activity_type_allowed;

alter table public.activities
    add constraint activities_activity_type_fkey
        foreign key (activity_type)
        references public.activity_types (slug)
        on update cascade
        on delete restrict;

alter table public.activity_types enable row level security;

create policy activity_types_select_all
on public.activity_types
for select
to anon, authenticated
using (true);

create policy activity_types_insert_admin
on public.activity_types
for insert
to authenticated
with check (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

revoke all on table public.activity_types from public, anon, authenticated;
grant select on table public.activity_types to anon, authenticated;
grant insert on table public.activity_types to authenticated;

commit;
