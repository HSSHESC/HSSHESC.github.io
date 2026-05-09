# ESC Website

한성과학고등학교 정보공학 동아리 ESC 소개 웹사이트입니다.

배포 주소: https://hsshesc.github.io/ESC/

## 구조

```text
index.html                         페이지 구조
assets/css/style.css               디자인
assets/js/content.js               수정이 잦은 콘텐츠 데이터
assets/js/main.js                  화면 렌더링과 동작
assets/img/                        이미지
assets/vendor/                     Bootstrap, Bootstrap Icons, Typed.js
```

## 콘텐츠 수정

대부분의 내용은 `assets/js/content.js`에서 수정합니다.

### 포트폴리오

`portfolio` 배열에 항목을 추가하거나 수정합니다.

```js
{
    title: "2026 예시 행사",
    date: "2026-04-01",
    description: "행사 설명",
    image: "assets/img/2026-04-01.png",
    icon: "bi-stars",
}
```

- `date`는 `YYYY-MM-DD` 형식으로 작성합니다.
- 포트폴리오는 날짜 기준 최신순으로 자동 정렬됩니다.
- 이미지는 `assets/img/`에 넣고 경로만 바꾸면 됩니다.

### 연락처

`contacts` 배열을 수정합니다.

```js
{
    icon: "bi-envelope",
    label: "이름",
    text: "email@example.com",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=email@example.com",
    social: true,
    socialIcon: "bi-envelope",
}
```

`social: true`인 항목은 Contact 하단 원형 아이콘에도 표시됩니다.

## 이미지 이름 규칙

이미지 파일명에는 내용 설명을 넣지 않고 날짜만 사용합니다.

```text
YYYY-MM-DD.png
YYYY-MM-DD.jpg
```

포트폴리오 이미지는 행사 날짜를 사용합니다.

```text
2025-03-06.png
2025-05-29.png
2025-12-22.jpg
```

로고 이미지는 예외적으로 `logo`가 들어간 이름을 사용합니다.

```text
esc-logo.png
esc-banner-logo.png
hssh-logo.jpg
```

## HTML 수정 기준

`index.html`은 섹션 구조만 유지합니다.

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
node --check .\assets\js\main.js
```

이미지 참조 확인:

```powershell
foreach ($f in Get-ChildItem .\assets\img -File) {
  $name = $f.Name
  $hits = rg -n --fixed-strings $name . 2>$null
  if (-not $hits) { $name }
}
```

## 배포

정적 사이트입니다. GitHub Pages에 그대로 올리면 동작합니다.

`.nojekyll`은 GitHub Pages가 파일을 그대로 제공하도록 하기 위해 둡니다.

## 주의

- `assets/vendor/`는 외부 라이브러리입니다. 일반적인 콘텐츠 수정 때는 건드리지 않습니다.
- `assets/js/main.js`는 동작 코드입니다. 행사/연락처 추가는 `content.js`에서 처리합니다.
