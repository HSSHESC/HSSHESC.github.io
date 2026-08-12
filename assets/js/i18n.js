(function () {
  "use strict";

  const supportedLocales = new Set(["ko", "en"]);
  const storageKey = "esc-locale";

  const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  const clone = (value) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));

  const merge = (base, override) => {
    if (!isPlainObject(base)) {
      return clone(override ?? base);
    }
    const result = clone(base);
    if (!isPlainObject(override)) {
      return result;
    }
    Object.entries(override).forEach(([key, value]) => {
      result[key] = isPlainObject(value)
        ? merge(result[key] ?? {}, value)
        : clone(value);
    });
    return result;
  };

  const getLocale = () => {
    const queryLocale = new URLSearchParams(window.location.search).get("lang");
    if (supportedLocales.has(queryLocale)) {
      return queryLocale;
    }
    const storedLocale = window.localStorage?.getItem(storageKey);
    return supportedLocales.has(storedLocale) ? storedLocale : "ko";
  };

  let currentLocale = getLocale();

  const setLocale = (locale) => {
    if (!supportedLocales.has(locale) || locale === currentLocale) {
      return;
    }
    currentLocale = locale;
    window.localStorage?.setItem(storageKey, locale);
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("lang")) {
      currentUrl.searchParams.set("lang", locale);
      window.history.replaceState({}, "", currentUrl);
    }
    document.documentElement.lang = locale;
    window.dispatchEvent(
      new CustomEvent("esc:languagechange", { detail: { locale } }),
    );
  };

  const localizeSite = (content, locale = currentLocale) => {
    if (locale === "ko") {
      return clone(content);
    }
    return merge(content, content?.translations?.[locale] ?? {});
  };

  const localizeActivity = (activity, locale = currentLocale) => ({
    ...activity,
    title:
      locale === "en" && activity.title_en ? activity.title_en : activity.title,
    description:
      locale === "en" && activity.description_en
        ? activity.description_en
        : activity.description,
  });

  const labels = {
    ko: {
      allYears: "전체 학년도",
      allTypes: "전체 유형",
      search: "활동 검색",
      searchPlaceholder: "제목, 설명 또는 태그 검색",
      noResults: "검색 조건에 맞는 활동이 없습니다.",
      year: "학년도",
      type: "활동 유형",
      reset: "초기화",
      previousImage: "이전 대표 이미지",
      nextImage: "다음 대표 이미지",
      pauseSlideshow: "자동 전환 일시정지",
      playSlideshow: "자동 전환 재생",
      noImage: "등록된 이미지가 없습니다.",
      openGallery: "활동 사진 크게 보기",
      types: {
        project: "프로젝트",
        education: "교육",
        festival: "축제",
        exchange: "교류",
        competition: "대회",
        other: "기타",
      },
    },
    en: {
      allYears: "All school years",
      allTypes: "All types",
      search: "Search activities",
      searchPlaceholder: "Search titles, descriptions, or tags",
      noResults: "No activities match these filters.",
      year: "School year",
      type: "Activity type",
      reset: "Reset",
      previousImage: "Previous activity image",
      nextImage: "Next activity image",
      pauseSlideshow: "Pause slideshow",
      playSlideshow: "Play slideshow",
      noImage: "No images have been added.",
      openGallery: "Open activity photo gallery",
      types: {
        project: "Project",
        education: "Education",
        festival: "Festival",
        exchange: "Exchange",
        competition: "Competition",
        other: "Other",
      },
    },
  };

  document.documentElement.lang = currentLocale;
  window.ESC_I18N = Object.freeze({
    getLocale: () => currentLocale,
    labels: () => labels[currentLocale],
    localizeActivity,
    localizeSite,
    merge,
    setLocale,
  });
})();
