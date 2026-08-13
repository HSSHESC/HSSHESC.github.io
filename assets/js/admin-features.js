(function () {
  "use strict";

  const client = window.ESC_SUPABASE;
  const toolsTab = document.querySelector("#toolsViewTab");
  const toolsView = document.querySelector("#toolsAdminView");
  const activityView = document.querySelector("#activityAdminView");
  const contentView = document.querySelector("#siteContentAdminView");
  const activityTab = document.querySelector("#activityViewTab");
  const contentTab = document.querySelector("#siteContentViewTab");
  const previewDialog = document.querySelector("#adminPreviewDialog");
  const previewTitle = document.querySelector("#adminPreviewTitle");
  const previewContent = document.querySelector("#adminPreviewContent");
  const faqItems = document.querySelector("#faqAdminItems");
  const revisionList = document.querySelector("#revisionList");
  const stats = document.querySelector("#adminStats");
  const visitorStatsChart = document.querySelector("#visitorStatsChart");
  const visitorStatsEndDate = document.querySelector("#visitorStatsEndDate");
  const visitorStatsForm = document.querySelector("#visitorStatsForm");
  const visitorStatsGranularity = document.querySelector(
    "#visitorStatsGranularity",
  );
  const visitorStatsStartDate = document.querySelector(
    "#visitorStatsStartDate",
  );
  const visitorStatsSummary = document.querySelector(
    "#visitorStatsSummary",
  );
  const visitorStatsTableBody = document.querySelector(
    "#visitorStatsTableBody",
  );
  const loadVisitorStatsButton = document.querySelector(
    "#loadVisitorStatsButton",
  );
  let currentUser = null;
  let faqContent = null;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const showPreview = (title, html) => {
    previewTitle.textContent = title;
    previewContent.innerHTML = html;
    previewDialog.showModal();
  };

  const activateTools = async () => {
    activityView.hidden = true;
    contentView.hidden = true;
    toolsView.hidden = false;
    activityTab.classList.remove("active");
    contentTab.classList.remove("active");
    toolsTab.classList.add("active");
    activityTab.setAttribute("aria-selected", "false");
    contentTab.setAttribute("aria-selected", "false");
    toolsTab.setAttribute("aria-selected", "true");
    await Promise.all([
      loadFaq(),
      loadStats(),
      loadVisitorStats(),
      loadRevisions(),
    ]);
  };

  [activityTab, contentTab].forEach((tab) =>
    tab.addEventListener("click", () => {
      toolsView.hidden = true;
      toolsTab.classList.remove("active");
      toolsTab.setAttribute("aria-selected", "false");
    }),
  );

  const createFaqRow = (item = {}) => {
    const row = document.createElement("div");
    row.className = "faq-admin-row";
    row.innerHTML = `
      <div>
        <label class="form-label">질문</label>
        <input class="form-control faq-question-ko" type="text" maxlength="300" value="${escapeHtml(item.question)}" />
      </div>
      <div>
        <label class="form-label">답변(Markdown)</label>
        <textarea class="form-control faq-answer-ko" maxlength="5000" rows="4">${escapeHtml(item.answer)}</textarea>
      </div>
      <button class="btn btn-sm btn-outline-danger faq-remove" type="button">질문 삭제</button>
    `;
    row
      .querySelector(".faq-remove")
      .addEventListener("click", () => row.remove());
    faqItems.append(row);
  };

  const loadFaq = async () => {
    const { data, error } = await client
      .from("site_content")
      .select("content")
      .eq("id", "home")
      .single();
    if (error) {
      throw error;
    }
    faqContent = data.content;
    const ko = faqContent.faq ?? {};
    document.querySelector("#faqTitleKo").value = ko.title ?? "";
    document.querySelector("#faqSubtitleKo").value = ko.subtitle ?? "";
    faqItems.replaceChildren();
    (ko.items ?? []).forEach((item) => createFaqRow(item));
  };

  const readFaqRows = () => {
    const rows = [...faqItems.querySelectorAll(".faq-admin-row")];
    return rows
      .map((row) => ({
        question: row.querySelector(".faq-question-ko").value.trim(),
        answer: row.querySelector(".faq-answer-ko").value.trim(),
      }))
      .filter((item) => item.question || item.answer);
  };

  const saveFaq = async () => {
    if (!currentUser || !faqContent) {
      return;
    }
    const nextContent = JSON.parse(JSON.stringify(faqContent));
    nextContent.faq = {
      title: document.querySelector("#faqTitleKo").value.trim(),
      subtitle: document.querySelector("#faqSubtitleKo").value.trim(),
      items: readFaqRows(),
    };
    const { error } = await client
      .from("site_content")
      .update({ content: nextContent, updated_by: currentUser.id })
      .eq("id", "home");
    if (error) {
      throw error;
    }
    faqContent = nextContent;
    window.alert("FAQ가 저장되었습니다.");
    await Promise.all([loadStats(), loadRevisions()]);
  };

  const koreanToday = () =>
    new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const shiftDate = (dateText, days) => {
    const date = new Date(`${dateText}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const shiftYear = (dateText, years) => {
    const date = new Date(`${dateText}T00:00:00Z`);
    date.setUTCFullYear(date.getUTCFullYear() + years);
    return date.toISOString().slice(0, 10);
  };

  const initializeVisitorStatsDates = () => {
    const today = koreanToday();
    const earliestDate = shiftYear(today, -1);
    [visitorStatsStartDate, visitorStatsEndDate].forEach((input) => {
      input.min = earliestDate;
      input.max = today;
    });
    visitorStatsStartDate.value = shiftDate(today, -29);
    visitorStatsEndDate.value = today;
  };

  const formatVisitorPeriod = (dateText, granularity) => {
    const [year, month, day] = dateText.split("-");
    return granularity === "month"
      ? `${year}.${month}`
      : `${year}.${month}.${day}`;
  };

  const createSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      name,
    );
    Object.entries(attributes).forEach(([attribute, value]) =>
      element.setAttribute(attribute, String(value)),
    );
    return element;
  };

  const renderVisitorStatsTable = (rows, granularity) => {
    visitorStatsTableBody.replaceChildren(
      ...rows.map((row) => {
        const tableRow = document.createElement("tr");
        const periodCell = document.createElement("td");
        const countCell = document.createElement("td");
        periodCell.textContent = formatVisitorPeriod(
          row.period_start,
          granularity,
        );
        countCell.textContent = `${row.visitor_count.toLocaleString("ko-KR")}명`;
        tableRow.append(periodCell, countCell);
        return tableRow;
      }),
    );
  };

  const renderVisitorStatsChart = (rows, granularity) => {
    visitorStatsChart.replaceChildren();
    renderVisitorStatsTable(rows, granularity);

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "visitor-stats-empty";
      empty.textContent = "선택한 기간의 방문자 데이터가 없습니다.";
      visitorStatsChart.append(empty);
      return;
    }

    const width = 960;
    const height = 360;
    const margin = { top: 24, right: 24, bottom: 58, left: 62 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maximum = Math.max(...rows.map((row) => row.visitor_count));
    const yMaximum = Math.max(4, Math.ceil(maximum / 4) * 4);
    const xPosition = (index) =>
      rows.length === 1
        ? margin.left + plotWidth / 2
        : margin.left + (index / (rows.length - 1)) * plotWidth;
    const yPosition = (count) =>
      margin.top + plotHeight - (count / yMaximum) * plotHeight;
    const svg = createSvgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": `${granularity === "month" ? "월별" : "날짜별"} 방문자 수 꺾은선 그래프`,
    });
    const title = createSvgElement("title");
    title.textContent = `${formatVisitorPeriod(rows[0].period_start, granularity)}부터 ${formatVisitorPeriod(rows.at(-1).period_start, granularity)}까지의 방문자 수`;
    svg.append(title);

    for (let index = 0; index <= 4; index += 1) {
      const value = Math.round(yMaximum * (1 - index / 4));
      const y = margin.top + (index / 4) * plotHeight;
      svg.append(
        createSvgElement("line", {
          class: "visitor-chart-grid",
          x1: margin.left,
          x2: width - margin.right,
          y1: y,
          y2: y,
        }),
      );
      const label = createSvgElement("text", {
        class: "visitor-chart-axis-label",
        x: margin.left - 12,
        y: y + 4,
        "text-anchor": "end",
      });
      label.textContent = String(value);
      svg.append(label);
    }

    const points = rows.map(
      (row, index) =>
        `${xPosition(index)},${yPosition(row.visitor_count)}`,
    );
    if (rows.length > 1) {
      const areaPath = [
        `M ${xPosition(0)} ${margin.top + plotHeight}`,
        ...rows.map(
          (row, index) =>
            `L ${xPosition(index)} ${yPosition(row.visitor_count)}`,
        ),
        `L ${xPosition(rows.length - 1)} ${margin.top + plotHeight}`,
        "Z",
      ].join(" ");
      svg.append(
        createSvgElement("path", {
          class: "visitor-chart-area",
          d: areaPath,
        }),
      );
    }
    svg.append(
      createSvgElement("polyline", {
        class: "visitor-chart-line",
        points: points.join(" "),
      }),
    );

    if (rows.length <= 60) {
      rows.forEach((row, index) => {
        const point = createSvgElement("circle", {
          class: "visitor-chart-point",
          cx: xPosition(index),
          cy: yPosition(row.visitor_count),
          r: 4,
        });
        const pointTitle = createSvgElement("title");
        pointTitle.textContent = `${formatVisitorPeriod(row.period_start, granularity)}: ${row.visitor_count}명`;
        point.append(pointTitle);
        svg.append(point);
      });
    }

    const labelIndexes = new Set([0, rows.length - 1]);
    const labelStep = Math.max(1, Math.ceil(rows.length / 7));
    for (let index = 0; index < rows.length; index += labelStep) {
      labelIndexes.add(index);
    }
    [...labelIndexes]
      .sort((first, second) => first - second)
      .forEach((index) => {
        const label = createSvgElement("text", {
          class: "visitor-chart-period-label",
          x: xPosition(index),
          y: height - 24,
        });
        label.textContent = formatVisitorPeriod(
          rows[index].period_start,
          granularity,
        );
        svg.append(label);
      });

    visitorStatsChart.append(svg);
  };

  const setVisitorStatsBusy = (busy) => {
    visitorStatsForm.setAttribute("aria-busy", String(busy));
    visitorStatsForm
      .querySelectorAll("input, select, button")
      .forEach((control) => {
        control.disabled = busy;
      });
    loadVisitorStatsButton.textContent = busy ? "조회 중..." : "조회";
  };

  const loadVisitorStats = async () => {
    visitorStatsStartDate.setCustomValidity("");
    const startDate = visitorStatsStartDate.value;
    const endDate = visitorStatsEndDate.value;
    const granularity = visitorStatsGranularity.value;
    if (startDate > endDate) {
      visitorStatsStartDate.setCustomValidity(
        "시작일은 종료일보다 늦을 수 없습니다.",
      );
    }
    if (!visitorStatsForm.reportValidity()) {
      return;
    }

    setVisitorStatsBusy(true);
    visitorStatsSummary.textContent = "방문자 통계를 불러오는 중입니다.";
    try {
      const { data, error } = await client.rpc("get_site_visitor_stats", {
        p_start_date: startDate,
        p_end_date: endDate,
        p_granularity: granularity,
      });
      if (error) {
        throw error;
      }

      const rows = (data ?? []).map((row) => ({
        period_start: row.period_start,
        visitor_count: Number(row.visitor_count) || 0,
      }));
      const maximum = Math.max(0, ...rows.map((row) => row.visitor_count));
      visitorStatsSummary.textContent = maximum
        ? `${formatVisitorPeriod(startDate, "day")}~${formatVisitorPeriod(endDate, "day")} · 최고 ${maximum.toLocaleString("ko-KR")}명`
        : "선택한 기간에 기록된 방문자가 없습니다.";
      renderVisitorStatsChart(rows, granularity);
    } catch (error) {
      console.error("방문자 통계를 불러오지 못했습니다.", error);
      visitorStatsSummary.textContent =
        "방문자 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
      renderVisitorStatsChart([], granularity);
    } finally {
      setVisitorStatsBusy(false);
    }
  };

  const loadStats = async () => {
    const [activities, photos, revisions] = await Promise.all([
      client.from("activities").select("activity_date,is_published"),
      client
        .from("activity_photos")
        .select("id", { count: "exact", head: true }),
      client
        .from("content_revisions")
        .select("id", { count: "exact", head: true }),
    ]);
    const error = activities.error || photos.error || revisions.error;
    if (error) {
      throw error;
    }
    const rows = activities.data ?? [];
    const cards = [
      ["전체 활동", rows.length],
      ["공개 활동", rows.filter((row) => row.is_published).length],
      ["비공개 활동", rows.filter((row) => !row.is_published).length],
      ["활동 사진", photos.count ?? photos.data?.length ?? 0],
      ["수정 이력", revisions.count ?? revisions.data?.length ?? 0],
    ];
    stats.innerHTML = cards
      .map(
        ([label, value]) =>
          `<div class="admin-stat-card"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`,
      )
      .join("");
  };

  const loadRevisions = async () => {
    const { data, error } = await client
      .from("content_revisions")
      .select("id,entity_type,entity_id,snapshot,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      throw error;
    }
    revisionList.replaceChildren();
    if (!data.length) {
      revisionList.textContent = "아직 저장된 수정 이력이 없습니다.";
      return;
    }
    data.forEach((revision) => {
      const row = document.createElement("article");
      row.className = "revision-row";
      const name =
        revision.entity_type === "activity"
          ? revision.snapshot.title || "활동"
          : "홈페이지 문구";
      row.innerHTML = `
        <div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(new Date(revision.created_at).toLocaleString("ko-KR"))}</span></div>
        <button class="btn btn-sm btn-outline-primary" type="button">이 버전 복원</button>
      `;
      row.querySelector("button").addEventListener("click", async () => {
        if (!window.confirm(`‘${name}’의 이 버전으로 복원하시겠습니까?`)) {
          return;
        }
        const { error: restoreError } = await restoreRevision(revision);
        if (restoreError) {
          window.alert(`복원하지 못했습니다: ${restoreError.message}`);
          return;
        }
        window.alert("복원되었습니다. 최신 데이터를 다시 불러옵니다.");
        window.location.reload();
      });
      revisionList.append(row);
    });
  };

  const restoreRevision = (revision) => {
    if (revision.entity_type === "site_content") {
      return client
        .from("site_content")
        .update({
          content: revision.snapshot.content,
          updated_by: currentUser.id,
        })
        .eq("id", revision.entity_id);
    }
    const allowed = [
      "title",
      "description",
      "activity_date",
      "external_url",
      "icon",
      "is_published",
      "activity_type",
      "tags",
    ];
    const payload = Object.fromEntries(
      allowed
        .filter((key) => revision.snapshot[key] !== undefined)
        .map((key) => [key, revision.snapshot[key]]),
    );
    return client
      .from("activities")
      .update(payload)
      .eq("id", revision.entity_id);
  };

  const previewActivity = () => {
    const title =
      document.querySelector("#activityTitle").value.trim() || "활동명";
    const description = document.querySelector("#activityDescription").value;
    const tags = document
      .querySelector("#activityTags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const descriptionHtml = window.ESC_MARKDOWN
      ? window.ESC_MARKDOWN.toHtml(description)
      : escapeHtml(description);
    showPreview(
      "활동 미리보기",
      `<article class="admin-preview-card"><span class="portfolio-type">${escapeHtml(document.querySelector("#activityTypeSelect").selectedOptions[0].textContent)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(document.querySelector("#activityDate").value)}</p><div class="markdown-content">${descriptionHtml}</div><div class="portfolio-tags">${tags.map((tag) => `<span class="portfolio-tag">${escapeHtml(tag)}</span>`).join("")}</div></article>`,
    );
  };

  toolsTab.addEventListener("click", () => {
    activateTools().catch((error) => {
      console.error("운영 도구를 불러오지 못했습니다.", error);
    });
  });
  document
    .querySelector("#addFaqButton")
    .addEventListener("click", () => createFaqRow());
  document
    .querySelector("#saveFaqButton")
    .addEventListener("click", () =>
      saveFaq().catch((error) =>
        window.alert(`FAQ 저장 실패: ${error.message}`),
      ),
    );
  document
    .querySelector("#refreshRevisionsButton")
    .addEventListener("click", () =>
      loadRevisions().catch((error) => window.alert(error.message)),
    );
  visitorStatsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadVisitorStats();
  });
  document
    .querySelector("#previewActivityButton")
    .addEventListener("click", previewActivity);
  document
    .querySelector("#closePreviewButton")
    .addEventListener("click", () => previewDialog.close());
  previewDialog.addEventListener("click", (event) => {
    if (event.target === previewDialog) {
      previewDialog.close();
    }
  });

  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
  });
  client.auth.getUser().then(({ data }) => {
    currentUser = data.user ?? currentUser;
  });
  initializeVisitorStatsDates();
})();
