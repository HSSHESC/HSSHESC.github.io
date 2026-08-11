// Fallback content used when Supabase is temporarily unavailable.
// The administrator page stores the editable copy in public.site_content.
window.ESC_CONTENT = {
  site: {
    meta: {
      title: "ESC",
      description: "ESC, pioneers of empty spaces",
      keywords: "introducing ESC",
    },
    brand: "ESC",
    navigation: {
      home: "Home",
      about: "About",
      activities: "Activities",
      portfolio: "Portfolio",
      contact: "Contact",
    },
    hero: {
      title: "ESC",
      typed_items: [
        "Developer",
        "Maker",
        "Leader",
        "Programmer",
        "Scientist",
        "Innovator",
      ],
    },
    about: {
      title: "동아리 소개",
      school_url: "https://hansungsh.sen.hs.kr/",
      paragraphs: [
        "안녕하세요! 저희는 한성과학고등학교의 정보공학 동아리 ESC입니다.",
        "동아리 이름 ESC는 Engineering Science of Computer라는 의미입니다.",
        "ESC에서는 정보공학과 관련된 다양한 활동을 진행합니다. 2026학년도에 계획된 활동은 다음과 같습니다.",
      ],
      plans: [
        "실생활이나 연구 과정에서 활용 가능한 프로그램과 프로그래밍 언어를 익히고, 이를 활용합니다.",
        "한성과학고등학교 수학과학체험전에서 중학생 대상 활동을 기획하고 운영합니다.",
        "한어울제를 위한 프로젝트를 기획 및 제작하고 부스를 운영합니다.",
        "세종과학고등학교 정보과학 동아리 CPU와 교류 활동을 진행합니다.",
      ],
    },
    activity_plans: {
      title: "활동 계획",
      subtitle: "2026학년도 ESC에서 진행할 동아리 활동입니다.",
      items: [
        {
          title: "수학과학체험전",
          description:
            "수학과학체험전은 한성과학고등학교와 서대문구청이 함께 주관하는 중학생 대상 교육 활동입니다. 수학과학체험전을 위한 활동을 기획하고 운영합니다.",
          icon: "bi-mortarboard-fill",
        },
        {
          title: "한어울제",
          description:
            "한어울제는 한성과학고등학교의 축제입니다. 한어울제에 참여하여 지난 1년간의 활동을 이용한 프로젝트를 기획 및 제작하고, 부스를 운영합니다.",
          icon: "bi-shop-window",
        },
        {
          title: "서울학생 AI개발 성과발표회",
          description:
            "서울특별시교육청에서 진행하는 서울학생 AI개발 성과발표회에 참가하여 ESC에서 진행한 프로젝트를 발표합니다.",
          icon: "bi-robot",
        },
        {
          title: "세종과학고등학교와의 교류",
          description:
            "세종과학고등학교 정보과학 동아리 CPU와 교류 활동을 진행합니다.",
          icon: "bi-people-fill",
        },
        {
          title: "프로그래밍 언어 공부",
          description:
            "Python, C++ 등 다양한 분야에서 활용되는 프로그래밍 언어를 학습하고, 이를 활용하여 인공지능과 알고리즘 등 여러 프로젝트를 진행합니다.",
          icon: "bi-code-slash",
        },
        {
          title: "Git 및 협업",
          description:
            "Git과 GitHub를 이용하여 하나의 프로젝트를 여러 명이 협업하여 진행하는 방법을 익히고, 이를 바탕으로 팀 프로젝트를 진행합니다.",
          icon: "bi-git",
        },
      ],
    },
    portfolio: {
      title: "포트폴리오",
    },
    contact: {
      title: "Contact",
      intro: "더 궁금한 사항이 있다면 아래 연락처를 통해 문의해 주세요.",
      items: [
        {
          icon: "bi-envelope",
          label: "짱 신재훈",
          text: "34-096@hansung-sh.hs.kr",
          href: "https://mail.google.com/mail/?view=cm&fs=1&to=34-096@hansung-sh.hs.kr",
          social: true,
          social_icon: "bi-envelope",
        },
        {
          icon: "bi-envelope",
          label: "부짱 이동하",
          text: "34-098@hansung-sh.hs.kr",
          href: "https://mail.google.com/mail/?view=cm&fs=1&to=34-098@hansung-sh.hs.kr",
          social: false,
          social_icon: "bi-envelope",
        },
        {
          icon: "bi-github",
          label: "GitHub",
          text: "HSSHESC",
          href: "https://github.com/HSSHESC",
          social: true,
          social_icon: "bi-github",
        },
      ],
    },
    footer: {
      copyright_name: "ESC",
      rights_text: "All Rights Reserved.",
      admin_label: "관리자",
    },
  },
  portfolioImageSource: {
    repository: "HSSHESC/HSSHESC.github.io",
    branch: "main",
    directory: "assets/img",
  },
  portfolio: [
    {
      title: "2026 수학과학체험전",
      date: "2026-05-21",
      description: "중학생 대상 수학과학체험전 활동을 기획하고 운영",
      icon: "bi-mortarboard-fill",
      href: "https://github.com/HSSHESC/sugwachae_2026",
    },
    {
      title: "2026 동아리 박람회",
      date: "2026-03-05",
      description:
        "작년 활동을 신입생들에게 소개하는 동아리 박람회에서 부스 운영",
      icon: "bi-people-fill",
    },
    {
      title: "2025 한어울제",
      date: "2025-12-24",
      description:
        "LoL 정글 위치 예측 프로그램, 리듬 게임, 모자이크, 3D 체스를 개발하여 부스 운영",
      icon: "bi-shop-window",
      href: "https://2025haneuljae-static.vercel.app/",
    },
    {
      title: "2025 서울학생 AI개발 성과발표회",
      date: "2025-12-22",
      description: "2025 서울학생 AI개발 성과발표회에서 동상과 인기상 수상",
      icon: "bi-robot",
      href: "https://github.com/HSSHESC/enemy-jungle-locator",
    },
    {
      title: "2025 수학과학체험전",
      date: "2025-05-29",
      description: "중학생 대상 수학과학체험전 활동을 기획하고 운영",
      icon: "bi-mortarboard-fill",
      href: "https://github.com/HSSHESC/sugwachae_2025",
    },
    {
      title: "2025 동아리 박람회",
      date: "2025-03-06",
      description: "ESC 활동을 신입생들에게 소개하는 동아리 박람회 운영",
      icon: "bi-people-fill",
    },
  ],
  contacts: [],
};

window.ESC_CONTENT.contacts = window.ESC_CONTENT.site.contact.items;
