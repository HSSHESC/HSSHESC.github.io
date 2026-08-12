-- Keep current-year homepage copy dynamic without changing historical content.
update public.site_content
set content = jsonb_set(
    content,
    '{activity_plans,subtitle}',
    to_jsonb('{year}학년도 ESC에서 진행할 동아리 활동입니다.'::text),
    false
)
where id = 'home'
  and content #>> '{activity_plans,subtitle}' =
      '2026학년도 ESC에서 진행할 동아리 활동입니다.';

update public.site_content
set content = jsonb_set(
    content,
    '{about,body_markdown}',
    to_jsonb(
        replace(
            content #>> '{about,body_markdown}',
            '2026학년도에 계획된 활동은 다음과 같습니다.',
            '{year}학년도에 계획된 활동은 다음과 같습니다.'
        )
    ),
    false
)
where id = 'home'
  and content #>> '{about,body_markdown}' like
      '%2026학년도에 계획된 활동은 다음과 같습니다.%';
