set local lock_timeout = '5s';

update public.site_content
set content = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    content - 'translations',
                    '{meta}',
                    coalesce(content -> 'meta', '{}'::jsonb) ||
                    '{
                      "description": "ESC, pioneers of empty spaces",
                      "keywords": "introducing ESC"
                    }'::jsonb,
                    true
                ),
                '{navigation}',
                '{
                  "home": "Home",
                  "about": "About",
                  "activities": "Activities",
                  "portfolio": "Portfolio",
                  "contact": "Contact",
                  "faq": "FAQ"
                }'::jsonb,
                true
            ),
            '{hero,typed_items}',
            '["Developer", "Maker", "Leader", "Programmer", "Scientist", "Innovator"]'::jsonb,
            true
        ),
        '{contact,title}',
        to_jsonb('Contact'::text),
        true
    ),
    '{footer,rights_text}',
    to_jsonb('All Rights Reserved.'::text),
    true
)
where id = 'home';

update public.site_content
set content = content - 'translations'
where content ? 'translations';

update public.content_revisions
set snapshot = case
    when jsonb_typeof(snapshot -> 'content') = 'object' then
        jsonb_set(
            snapshot - 'title_en' - 'description_en' - 'translations',
            '{content}',
            (snapshot -> 'content') - 'translations',
            false
        )
    else snapshot - 'title_en' - 'description_en' - 'translations'
end
where snapshot ? 'title_en'
   or snapshot ? 'description_en'
   or snapshot ? 'translations'
   or snapshot -> 'content' ? 'translations';

alter table public.activities
    drop constraint if exists activities_title_en_length_check,
    drop constraint if exists activities_description_en_length_check,
    drop column if exists title_en,
    drop column if exists description_en;
