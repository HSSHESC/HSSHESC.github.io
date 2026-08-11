(function () {
  "use strict";

  const client = window.ESC_SUPABASE;
  const fallbackContent = window.ESC_CONTENT?.site ?? {};

  const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  const clone = (value) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));

  const getSafeUrl = (value) => {
    if (!value) {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  };

  const mergeContent = (base, override) => {
    if (!isPlainObject(base)) {
      return clone(override ?? base);
    }

    const result = clone(base);
    if (!isPlainObject(override)) {
      return result;
    }

    Object.entries(override).forEach(([key, value]) => {
      result[key] = isPlainObject(value)
        ? mergeContent(result[key] ?? {}, value)
        : clone(value);
    });

    return result;
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && typeof value === "string") {
      element.textContent = value;
    }
  };

  const setMetaContent = (name, value) => {
    const element = document.querySelector(`meta[name="${name}"]`);
    if (element && typeof value === "string") {
      element.setAttribute("content", value);
    }
  };

  const appendLinkedText = (element, text, schoolUrl) => {
    const schoolName = "한성과학고등학교";
    const pieces = String(text).split(schoolName);

    pieces.forEach((piece, index) => {
      element.append(document.createTextNode(piece));
      if (index >= pieces.length - 1) {
        return;
      }

      const safeSchoolUrl = getSafeUrl(schoolUrl);
      if (safeSchoolUrl) {
        const link = document.createElement("a");
        link.className = "school-link";
        link.href = safeSchoolUrl;
        link.textContent = schoolName;
        element.append(link);
      } else {
        element.append(document.createTextNode(schoolName));
      }
    });
  };

  const renderAbout = (about) => {
    const paragraphContainer = document.querySelector("#aboutParagraphs");
    const planList = document.querySelector("#aboutPlanItems");

    if (paragraphContainer) {
      paragraphContainer.replaceChildren();
      (Array.isArray(about.paragraphs) ? about.paragraphs : []).forEach(
        (text) => {
          const paragraph = document.createElement("p");
          paragraph.className = "lead";
          appendLinkedText(paragraph, text, about.school_url);
          paragraphContainer.append(paragraph);
        },
      );
    }

    if (planList) {
      planList.replaceChildren();
      (Array.isArray(about.plans) ? about.plans : []).forEach((text) => {
        const item = document.createElement("li");
        appendLinkedText(item, text, about.school_url);
        planList.append(item);
      });
    }
  };

  const validIcon = (value) =>
    /^bi-[a-z0-9-]+$/.test(value) ? value : "bi-stars";

  const renderActivityPlans = (activityPlans, schoolUrl) => {
    const container = document.querySelector("#serviceItems");
    if (!container) {
      return;
    }

    container.replaceChildren();
    const items = Array.isArray(activityPlans.items) ? activityPlans.items : [];

    items.forEach((item) => {
      const column = document.createElement("div");
      column.className = "col-md-4";

      const box = document.createElement("div");
      box.className = "service-box";

      const iconContainer = document.createElement("div");
      iconContainer.className = "service-ico";
      const iconCircle = document.createElement("span");
      iconCircle.className = "ico-circle";
      const icon = document.createElement("i");
      icon.className = `bi ${validIcon(item.icon)}`;
      iconCircle.append(icon);
      iconContainer.append(iconCircle);

      const content = document.createElement("div");
      content.className = "service-content";
      const title = document.createElement("h2");
      title.className = "s-title";
      title.textContent = item.title ?? "";
      const description = document.createElement("p");
      description.className = "s-description text-center";
      appendLinkedText(description, item.description ?? "", schoolUrl);
      content.append(title, description);

      box.append(iconContainer, content);
      column.append(box);
      container.append(column);
    });
  };

  const applyContent = (content) => {
    document.documentElement.lang = "ko";
    document.title = content.meta?.title ?? "ESC";
    setMetaContent("description", content.meta?.description ?? "");
    setMetaContent("keywords", content.meta?.keywords ?? "");

    setText("#siteBrand", content.brand);
    setText("#navHome", content.navigation?.home);
    setText("#navAbout", content.navigation?.about);
    setText("#navActivities", content.navigation?.activities);
    setText("#navPortfolio", content.navigation?.portfolio);
    setText("#navContact", content.navigation?.contact);
    setText("#heroTitle", content.hero?.title);

    const typed = document.querySelector(".typed");
    if (typed && Array.isArray(content.hero?.typed_items)) {
      typed.dataset.typedItems = content.hero.typed_items.join(",");
    }

    setText("#aboutTitle", content.about?.title);
    renderAbout(content.about ?? {});
    setText("#servicesTitle", content.activity_plans?.title);
    setText("#servicesSubtitle", content.activity_plans?.subtitle);
    renderActivityPlans(
      content.activity_plans ?? {},
      content.about?.school_url,
    );
    setText("#portfolioTitle", content.portfolio?.title);
    setText("#contactTitle", content.contact?.title);
    setText("#contactIntro", content.contact?.intro);
    setText("#footerCopyrightName", content.footer?.copyright_name);
    setText("#footerRights", content.footer?.rights_text);
    setText("#footerAdminLabel", content.footer?.admin_label);

    window.ESC_CONTENT.site = content;
    window.ESC_CONTENT.contacts = Array.isArray(content.contact?.items)
      ? content.contact.items
      : [];
  };

  const loadContent = async () => {
    if (!client) {
      throw new Error("Supabase client is unavailable.");
    }

    const { data, error } = await client
      .from("site_content")
      .select("content")
      .eq("id", "home")
      .single();

    if (error) {
      throw error;
    }

    return mergeContent(fallbackContent, data.content);
  };

  const loadAndApply = async () => {
    let content = clone(fallbackContent);
    applyContent(content);

    try {
      content = await loadContent();
      applyContent(content);
    } catch (error) {
      console.error(
        "Supabase 페이지 콘텐츠를 불러오지 못해 기본 콘텐츠를 사용합니다.",
        error,
      );
    }

    return content;
  };

  window.ESC_SITE_CONTENT = {
    applyContent,
    fallbackContent: clone(fallbackContent),
    loadContent,
    mergeContent,
  };
  window.ESC_SITE_CONTENT_READY = loadAndApply();
})();
