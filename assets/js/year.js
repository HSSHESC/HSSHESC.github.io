(function () {
  "use strict";

  const koreanTimeZone = "Asia/Seoul";
  const automaticYearToken = "{year}";
  const legacyAutomaticYearPatterns = [
    /(?:19|20)\d{2}(?=학년도 ESC에서 진행할 동아리 활동입니다(?:\.|$))/g,
    /(?:19|20)\d{2}(?=학년도에 계획된 활동은 다음과 같습니다(?:\.|$))/g,
  ];

  const getCurrentKoreanYear = (date = new Date()) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        timeZone: koreanTimeZone,
      }).format(date);
    } catch {
      const koreanDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return String(koreanDate.getUTCFullYear());
    }
  };

  const normalizeYearTemplate = (value) => {
    let template = String(value ?? "");
    legacyAutomaticYearPatterns.forEach((pattern) => {
      template = template.replace(pattern, automaticYearToken);
    });
    return template;
  };

  const renderYearTemplate = (value, date = new Date()) =>
    normalizeYearTemplate(value).replaceAll(
      automaticYearToken,
      getCurrentKoreanYear(date),
    );

  window.ESC_YEAR = Object.freeze({
    getCurrentKoreanYear,
    normalizeYearTemplate,
    renderYearTemplate,
  });
})();
