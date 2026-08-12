update public.site_content
set content = jsonb_set(
    content,
    '{translations}',
    coalesce(content -> 'translations', '{}'::jsonb) || jsonb_build_object(
        'en',
        coalesce(content #> '{translations,en}', '{}'::jsonb) ||
        '{
          "meta": {
            "title": "ESC — Engineering Science of Computer",
            "description": "Official website of ESC, the computer engineering club at Hansung Science High School.",
            "keywords": "ESC, Hansung Science High School, computer engineering club"
          },
          "navigation": {
            "home": "Home",
            "about": "About",
            "activities": "Activities",
            "portfolio": "Portfolio",
            "faq": "FAQ",
            "contact": "Contact"
          },
          "about": {
            "title": "About ESC",
            "body_markdown": "Hello! We are ESC, the computer engineering club of Hansung Science High School.\n\nESC stands for **Engineering Science of Computer**.\n\nWe explore computer engineering through a variety of activities. Here are our plans for the {year} school year.",
            "plans_markdown": "- Learn programming languages and tools useful in everyday life and research.\n- Plan and operate educational activities for middle school students.\n- Build projects and run a booth for the school festival.\n- Exchange ideas with other computer science clubs."
          },
          "activity_plans": {
            "title": "Activity Plans",
            "subtitle": "ESC activities for the {year} school year."
          },
          "portfolio": {"title": "Activity Archive"},
          "contact": {
            "title": "Contact",
            "intro": "If you have any questions, please contact us using the information below."
          },
          "footer": {"admin_label": "Admin"},
          "faq": {
            "title": "Frequently Asked Questions",
            "subtitle": "Find answers to common questions about ESC.",
            "items": []
          }
        }'::jsonb
    ),
    true
)
where id = 'home';
