begin;

-- The initial logos remain as local, versioned fallbacks until an authenticated
-- administrator uploads replacements through the admin page. Keeping these
-- values null prevents public pages from requesting Storage objects that do not
-- exist yet.
update public.site_content
set content = jsonb_set(
    jsonb_set(
        content,
        '{branding,club_logo_storage_path}',
        'null'::jsonb,
        true
    ),
    '{branding,school_logo_storage_path}',
    'null'::jsonb,
    true
)
where id = 'home';

commit;
