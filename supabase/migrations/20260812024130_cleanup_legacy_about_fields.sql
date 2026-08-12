begin;

-- Keep the Markdown values and remove legacy arrays that an older fallback
-- object could reintroduce when an administrator saved another section.
update public.site_content
set content = jsonb_set(
    content,
    '{about}',
    (content -> 'about') - 'paragraphs' - 'plans',
    false
)
where id = 'home'
    and jsonb_typeof(content -> 'about') = 'object'
    and jsonb_typeof(content #> '{about,body_markdown}') = 'string'
    and jsonb_typeof(content #> '{about,plans_markdown}') = 'string';

commit;
