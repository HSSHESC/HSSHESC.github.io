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
assets/js/supabase-config.js       공개 가능한 Supabase 접속 설정
assets/js/supabase-client.js       Supabase 브라우저 클라이언트
assets/js/content.js               장애 시 사용할 전체 대체 콘텐츠
assets/js/site-content.js          공개 페이지 문구 조회와 안전한 DOM 렌더링
assets/js/main.js                  공개 화면 렌더링과 동작
assets/img/                        로고와 기존 활동 이미지
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
- 브라우저 제목과 검색 설명
- 상단 메뉴와 첫 화면 문구
- 동아리 소개와 활동 계획 카드
- 포트폴리오·연락처·푸터 문구

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
- 공개 활동 사진에만 서명 URL을 발급하는 Storage 조회 정책
- Storage 업로드·수정·삭제 관리자 정책
- 기존 포트폴리오 활동 6개, 사진 12개와 홈페이지 전체 문구

`assets/js/supabase-config.js`에는 브라우저에 공개해도 되는 프로젝트 URL과
publishable key만 들어갑니다. `service_role` 키나 secret key는 절대 넣지
않습니다.

## 페이지 문구와 대체 콘텐츠

소개, 메뉴, 활동 계획, 연락처와 푸터는 관리자 화면의 **페이지 문구** 메뉴에서
수정합니다. 저장 결과는 `site_content`의 `home` 행에 JSONB로 저장됩니다. 공개
페이지는 사용자 입력을 HTML로 직접 삽입하지 않고 DOM의 텍스트로 렌더링합니다.

Supabase 조회가 일시적으로 실패하면 `assets/js/content.js`의 페이지 문구와
`portfolio` 배열, GitHub 이미지 폴더를 대체 데이터로 사용합니다. 정상
상태에서는 Supabase 데이터가 우선합니다. `content.js`는 장애 시 대체본이므로
일상적인 콘텐츠 수정에는 사용하지 않습니다.

## 기존 이미지 폴더

마이그레이션 전부터 있던 활동 사진은 Supabase Storage로 복사되었습니다. 아래
폴더는 Supabase 장애 시 대체 화면과 저장소 이력을 위해 유지합니다.

```text
assets/img/2025-03-06/
assets/img/2025-05-29/
assets/img/2025-12-22/
assets/img/2025-12-24/
assets/img/2026-03-05/
assets/img/2026-05-21/
```

정상 상태에서는 기존 사진과 새 활동 사진 모두 Supabase Storage의 만료형 서명
URL로 제공됩니다. 로고와 배경 같은 디자인 자산은 계속 `assets/img/`에 둡니다.

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
node --check .\assets\js\supabase-config.js
node --check .\assets\js\supabase-client.js
node --check .\assets\js\site-content.js
node --check .\assets\js\activities.js
node --check .\assets\js\admin.js
node --check .\assets\js\main.js
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
