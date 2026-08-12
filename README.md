# ESC Website

한성과학고등학교 정보공학 동아리 ESC 소개 웹사이트입니다.

배포 주소: https://hsshesc.github.io/

## 구조

```text
index.html                         공개 홈페이지
admin.html                         관리자 로그인 및 홈페이지 관리 화면
assets/css/style.css               공개 홈페이지 디자인
assets/css/admin.css               관리자 화면 디자인
assets/js/activities.js            공개 활동 데이터 조회
assets/js/admin.js                 관리자 로그인, 활동·사진·페이지 문구 CRUD
assets/js/markdown.js              사용자 입력 Markdown의 안전한 렌더링
assets/js/supabase-config.js       공개 가능한 Supabase 접속 설정
assets/js/supabase-client.js       Supabase 브라우저 클라이언트
assets/js/content.js               장애 시 사용할 전체 대체 콘텐츠
assets/js/site-content.js          공개 페이지 문구 조회와 안전한 DOM 렌더링
assets/js/main.js                  공개 화면 렌더링과 동작
assets/img/                        업로드 전 사용할 기본 동아리·학교 로고
assets/vendor/                     고정 버전 외부 라이브러리
supabase/migrations/               DB, RLS, Storage 구성 SQL
```

## 활동 관리

관리자 화면: https://hsshesc.github.io/admin.html

관리자는 다음 내용을 추가·수정·삭제할 수 있습니다.

- 활동명
- 날짜
- 활동 설명
- 관련 링크와 아이콘
- 공개 여부
- 여러 장의 활동 사진
- 사진별 설명과 표시 순서
- Markdown 형식의 활동 설명과 홈페이지 본문
- 브라우저 제목과 검색 설명
- 상단 메뉴와 첫 화면 문구
- 동아리 소개와 활동 계획 카드
- 동아리·학교 로고 업로드와 대체 설명
- Contact 학교 로고 위 오버레이 색상
- 포트폴리오·연락처·푸터 문구
- 이메일 또는 GitHub 유형의 연락처

페이지 문구 편집 화면은 기본 정보, 소개, 활동 계획, 연락처, 푸터 영역마다
별도의 저장 버튼을 제공합니다. 이메일 연락처는 입력한 주소에서 `mailto:` 링크를
자동으로 만들고, GitHub 연락처는 표시 이름과 프로필 링크를 각각 저장합니다.
아이콘 선택란에는 현재 아이콘의 모양과 이름을 함께 표시합니다.

활동, 사진 설명과 페이지 문구는 Supabase Postgres에 저장됩니다. 기존 활동 사진
12개와 새 사진 파일은 모두 비공개 `activity-images` Storage 버킷에 저장됩니다.
공개 홈페이지는 게시된 활동만 날짜순으로 조회하고, 공개 활동 사진에는 10분간
유효한 서명 URL을 발급합니다. 비공개 활동과 그 사진은 RLS에 의해 관리자에게만
반환됩니다.

## 최초 관리자 계정 설정

1. Supabase Dashboard의 **Authentication → Users**에서 이메일/비밀번호 사용자를
   생성합니다. 비밀번호를 코드나 GitHub 저장소에 넣지 않습니다.
2. SQL Editor에서 아래 SQL의 이메일을 실제 관리자 이메일로 바꾸어 한 번
   실행합니다.

```sql
insert into public.site_admins (user_id)
select id
from auth.users
where lower(email) = lower('ADMIN_EMAIL@example.com')
on conflict (user_id) do nothing;
```

3. `admin.html`에서 같은 이메일과 비밀번호로 로그인합니다.

관리자 권한을 취소하려면 다음 SQL을 사용합니다.

```sql
delete from public.site_admins
where user_id = (
    select id
    from auth.users
    where lower(email) = lower('ADMIN_EMAIL@example.com')
);
```

일반 Auth 사용자는 로그인에 성공하더라도 `site_admins`에 등록되어 있지 않으면
관리자 화면과 쓰기 작업을 사용할 수 없습니다.

## Supabase 구성

마이그레이션은 다음 항목을 구성합니다.

- `activities`, `activity_photos`, `site_content`, `site_admins` 테이블
- 공개 읽기와 관리자 쓰기를 분리한 RLS 정책
- 명시적인 Data API `GRANT`
- 6 MiB 이미지 제한이 적용된 비공개 `activity-images` 버킷
- 6 MiB 이미지 제한이 적용된 공개 `site-assets` 로고 버킷
- 공개 활동 사진에만 서명 URL을 발급하는 Storage 조회 정책
- 두 버킷의 업로드·수정·삭제 관리자 정책
- 기존 포트폴리오 활동 6개, 사진 12개와 홈페이지 전체 문구

`assets/js/supabase-config.js`에는 브라우저에 공개해도 되는 프로젝트 URL과
publishable key만 들어갑니다. `service_role` 키나 secret key는 절대 넣지
않습니다.

## 페이지 문구와 대체 콘텐츠

소개, 메뉴, 활동 계획, 연락처와 푸터는 관리자 화면의 **페이지 문구** 메뉴에서
수정합니다. 저장 결과는 `site_content`의 `home` 행에 JSONB로 저장됩니다. 활동
설명, 소개 문단, 소개 활동 목록, 활동 계획 카드 설명과 연락처 안내에는 Markdown을
사용할 수 있습니다. Markdown은 허용한 링크 프로토콜과 안전한 DOM 요소만 생성해
임의 HTML 또는 스크립트를 실행하지 않습니다.

Supabase 조회가 일시적으로 실패하면 `assets/js/content.js`의 페이지 문구와
기본 로고를 사용합니다. 활동 기록은 데이터 불일치를 막기 위해 Supabase에서만
조회합니다. 정상 상태에서는 Supabase 데이터가 우선합니다. `content.js`는 장애 시
대체본이므로 일상적인 콘텐츠 수정에는 사용하지 않습니다.

## 이미지 저장 위치

기존 활동 사진 12개는 비공개 `activity-images` Storage로 이관되었고, 데이터베이스의
`activity_photos.storage_path`와 연결되어 있습니다. 이관 전의 활동 이미지 폴더와
사용하지 않는 로고 변형은 저장소에서 제거했습니다.

동아리·학교 로고는 관리자가 처음 새 파일을 저장하기 전까지
`assets/img/esc-logo.png`와 `assets/img/hssh-logo.jpg`를 기본값으로 사용합니다.
관리자 화면에서 로고를 저장하면 공개 `site-assets` Storage의 고유 경로를 사용하며,
교체하거나 제거한 이전 업로드 파일도 정리합니다.

## HTML 수정 기준

`index.html`은 섹션 구조를 유지합니다.

주요 섹션 id:

```text
#hero
#about
#services
#portfolio
#contact
```

상단 메뉴는 이 id와 연결됩니다. id를 바꾸면 메뉴 링크도 같이 바꿔야 합니다.

아래 id는 JavaScript가 콘텐츠를 채우는 자리이므로 삭제하지 마세요.

```html
<div id="portfolioItems"></div>
<ul id="contactList"></ul>
<ul id="contactSocials"></ul>
```

## 확인 명령

JavaScript 문법 확인:

```powershell
node --check .\assets\js\content.js
node --check .\assets\js\markdown.js
node --check .\assets\js\supabase-config.js
node --check .\assets\js\supabase-client.js
node --check .\assets\js\site-content.js
node --check .\assets\js\activities.js
node --check .\assets\js\admin.js
node --check .\assets\js\main.js
node .\tests\markdown.test.cjs
node .\tests\static-assets.test.cjs
node .\tests\supabase-public.test.cjs
```

Supabase를 수정한 뒤에는 Dashboard의 Security Advisor와 Performance Advisor도
확인합니다.

## 배포

정적 사이트입니다. GitHub Pages에 그대로 올리면 동작합니다.

`.nojekyll`은 GitHub Pages가 파일을 그대로 제공하도록 하기 위해 둡니다.

## 주의

- `assets/vendor/`는 외부 라이브러리입니다. 일반적인 콘텐츠 수정 때는 건드리지 않습니다.
- 활동과 페이지 문구는 `content.js`를 직접 수정하지 말고 관리자 화면에서 관리합니다.
- 브라우저의 publishable key는 비밀 키가 아닙니다. 실제 보안 경계는 RLS입니다.
