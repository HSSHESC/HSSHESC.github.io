update public.site_content
set content = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    content,
                    '{meta}',
                    coalesce(content -> 'meta', '{}'::jsonb) ||
                    '{
                      "description": "한성과학고등학교 정보공학 동아리 ESC 공식 홈페이지",
                      "keywords": "ESC, 한성과학고등학교, 정보공학 동아리"
                    }'::jsonb,
                    true
                ),
                '{navigation}',
                '{
                  "home": "홈",
                  "about": "소개",
                  "activities": "활동 계획",
                  "portfolio": "활동 기록",
                  "contact": "연락처",
                  "faq": "FAQ"
                }'::jsonb,
                true
            ),
            '{hero,typed_items}',
            '["개발자", "제작자", "리더", "프로그래머", "과학자", "혁신가"]'::jsonb,
            true
        ),
        '{contact,title}',
        to_jsonb('연락처'::text),
        true
    ),
    '{footer,rights_text}',
    to_jsonb('모든 권리 보유.'::text),
    true
)
where id = 'home';
