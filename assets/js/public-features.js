(function () {
  "use strict";

  const languageSwitch = document.querySelector("#languageSwitch");
  const searchInput = document.querySelector("#activitySearch");
  const yearSelect = document.querySelector("#activityYear");
  const typeSelect = document.querySelector("#activityType");
  const clearButton = document.querySelector("#clearActivityFilters");
  const resultCount = document.querySelector("#portfolioResultCount");

  const refreshLanguageControls = () => {
    const locale = window.ESC_I18N.getLocale();
    const labels = window.ESC_I18N.labels();
    languageSwitch.textContent = locale === "ko" ? "EN" : "한국어";
    languageSwitch.setAttribute(
      "aria-label",
      locale === "ko" ? "영어로 보기" : "View in Korean",
    );
    document.querySelector("#activitySearchLabel").textContent = labels.search;
    document.querySelector("#activityYearLabel").textContent = labels.year;
    document.querySelector("#activityTypeLabel").textContent = labels.type;
    searchInput.placeholder = labels.searchPlaceholder;
    yearSelect.options[0].textContent = labels.allYears;
    typeSelect.options[0].textContent = labels.allTypes;
    clearButton.textContent = labels.reset;
  };

  const applyFilters = () => {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const year = yearSelect.value;
    const type = typeSelect.value;
    const cards = [...document.querySelectorAll(".portfolio-item")];
    let visibleCount = 0;

    cards.forEach((card) => {
      const visible =
        (!query || card.dataset.search.includes(query)) &&
        (!year || card.dataset.year === year) &&
        (!type || card.dataset.type === type);
      card.closest(".col-lg-6").hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    });

    const locale = window.ESC_I18N.getLocale();
    resultCount.textContent = cards.length
      ? visibleCount
        ? locale === "ko"
          ? `${cards.length}개 중 ${visibleCount}개 활동 표시`
          : `Showing ${visibleCount} of ${cards.length} activities`
        : window.ESC_I18N.labels().noResults
      : "";
  };

  const populateFilters = () => {
    const cards = [...document.querySelectorAll(".portfolio-item")];
    const selectedYear = yearSelect.value;
    const selectedType = typeSelect.value;
    const years = [...new Set(cards.map((card) => card.dataset.year))]
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    const types = [...new Set(cards.map((card) => card.dataset.type))].filter(
      Boolean,
    );

    yearSelect.replaceChildren(
      new Option(window.ESC_I18N.labels().allYears, ""),
    );
    years.forEach((year) =>
      yearSelect.add(
        new Option(
          window.ESC_I18N.getLocale() === "ko" ? `${year}학년도` : year,
          year,
        ),
      ),
    );
    typeSelect.replaceChildren(
      new Option(window.ESC_I18N.labels().allTypes, ""),
    );
    types.forEach((type) =>
      typeSelect.add(
        new Option(window.ESC_I18N.labels().types[type] ?? type, type),
      ),
    );
    yearSelect.value = years.includes(selectedYear) ? selectedYear : "";
    typeSelect.value = types.includes(selectedType) ? selectedType : "";
    applyFilters();
  };

  languageSwitch?.addEventListener("click", () => {
    window.ESC_I18N.setLocale(
      window.ESC_I18N.getLocale() === "ko" ? "en" : "ko",
    );
    window.location.reload();
  });
  [searchInput, yearSelect, typeSelect].forEach((control) =>
    control?.addEventListener("input", applyFilters),
  );
  clearButton?.addEventListener("click", () => {
    searchInput.value = "";
    yearSelect.value = "";
    typeSelect.value = "";
    applyFilters();
    searchInput.focus();
  });

  window.addEventListener("esc:portfolio-rendered", populateFilters);
  window.addEventListener("esc:languagechange", refreshLanguageControls);
  refreshLanguageControls();
})();
