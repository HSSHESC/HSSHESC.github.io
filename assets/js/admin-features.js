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
    await Promise.all([loadFaq(), loadStats(), loadRevisions()]);
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
    const byYear = rows.reduce((counts, activity) => {
      const year = String(activity.activity_date).slice(0, 4);
      counts[year] = (counts[year] ?? 0) + 1;
      return counts;
    }, {});
    const cards = [
      ["전체 활동", rows.length],
      ["공개 활동", rows.filter((row) => row.is_published).length],
      ["비공개 활동", rows.filter((row) => !row.is_published).length],
      ["활동 사진", photos.count ?? photos.data?.length ?? 0],
      ["수정 이력", revisions.count ?? revisions.data?.length ?? 0],
      [
        "학년도별",
        Object.entries(byYear)
          .map(([year, count]) => `${year}: ${count}`)
          .join(" · ") || "없음",
      ],
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

  const previewSite = () => {
    const title = document.querySelector("#siteMetaTitle").value || "ESC";
    const hero = document.querySelector("#heroTitleText").value || "ESC";
    const about = document.querySelector("#aboutParagraphs").value;
    const aboutHtml = window.ESC_MARKDOWN
      ? window.ESC_MARKDOWN.toHtml(about)
      : escapeHtml(about);
    showPreview(
      "홈페이지 문구 미리보기",
      `<div class="admin-site-preview"><h1>${escapeHtml(hero)}</h1><h2>${escapeHtml(title)}</h2><div class="markdown-content">${aboutHtml}</div><p>활동 계획: ${escapeHtml(document.querySelector("#servicesSubtitleText").value)}</p><p>연락처: ${escapeHtml(document.querySelector("#contactIntroText").value)}</p></div>`,
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
  document
    .querySelector("#previewActivityButton")
    .addEventListener("click", previewActivity);
  document
    .querySelector("#previewSiteButton")
    .addEventListener("click", previewSite);
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
})();
