(function () {
  "use strict";

  const searchInput = document.querySelector("#activitySearch");
  const yearSelect = document.querySelector("#activityYear");
  const typeSelect = document.querySelector("#activityType");
  const clearButton = document.querySelector("#clearActivityFilters");
  const resultCount = document.querySelector("#portfolioResultCount");
  const typeLabels = {
    project: "프로젝트",
    education: "교육",
    festival: "축제",
    exchange: "교류",
    competition: "대회",
    other: "기타",
  };

  const applyFilters = () => {
    const query = searchInput.value.trim().toLocaleLowerCase("ko-KR");
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

    resultCount.textContent = cards.length
      ? visibleCount
        ? `${cards.length}개 중 ${visibleCount}개 활동 표시`
        : "검색 조건에 맞는 활동이 없습니다."
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
    const dynamicTypeLabels = new Map(
      cards
        .filter((card) => card.dataset.type)
        .map((card) => [card.dataset.type, card.dataset.typeLabel]),
    );

    yearSelect.replaceChildren(new Option("전체 학년도", ""));
    years.forEach((year) => yearSelect.add(new Option(`${year}학년도`, year)));
    typeSelect.replaceChildren(new Option("전체 유형", ""));
    types.forEach((type) =>
      typeSelect.add(
        new Option(
          dynamicTypeLabels.get(type) || typeLabels[type] || type,
          type,
        ),
      ),
    );
    yearSelect.value = years.includes(selectedYear) ? selectedYear : "";
    typeSelect.value = types.includes(selectedType) ? selectedType : "";
    applyFilters();
  };

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
})();
