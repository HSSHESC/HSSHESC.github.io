(function () {
  "use strict";

  const client = window.ESC_SUPABASE;
  const fallbackContent = window.ESC_CONTENT?.site ?? {};
  const siteAssetsBucket = window.ESC_SUPABASE_CONFIG?.siteAssetsBucket;
  const year = window.ESC_YEAR;

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
    } catch {
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

  const withSchoolLink = (text, schoolUrl) => {
    const schoolName = "한성과학고등학교";
    const value = String(text ?? "");
    const safeSchoolUrl = getSafeUrl(schoolUrl);
    if (!safeSchoolUrl || value.includes(`[${schoolName}](`)) {
      return value;
    }
    return value.split(schoolName).join(`[${schoolName}](${safeSchoolUrl})`);
  };

  const appendMarkdown = (element, text, schoolUrl = "") => {
    element.replaceChildren();
    const markdown = withSchoolLink(text, schoolUrl);
    if (window.ESC_MARKDOWN) {
      element.append(window.ESC_MARKDOWN.render(markdown));
    } else {
      element.textContent = markdown;
    }
  };

  const renderAbout = (about) => {
    const paragraphContainer = document.querySelector("#aboutParagraphs");
    const planList = document.querySelector("#aboutPlanItems");

    if (paragraphContainer) {
      paragraphContainer.classList.add("lead", "markdown-content");
      const bodyMarkdown =
        typeof about.body_markdown === "string"
          ? about.body_markdown
          : (about.paragraphs ?? []).join("\n\n");
      appendMarkdown(
        paragraphContainer,
        year.renderYearTemplate(bodyMarkdown),
        about.school_url,
      );
    }

    if (planList) {
      const plansMarkdown =
        typeof about.plans_markdown === "string"
          ? about.plans_markdown
          : (about.plans ?? []).map((item) => `- ${item}`).join("\n");
      appendMarkdown(planList, plansMarkdown, about.school_url);
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
      const description = document.createElement("div");
      description.className =
        "s-description text-center markdown-content markdown-content-compact";
      appendMarkdown(description, item.description ?? "", schoolUrl);
      content.append(title, description);

      box.append(iconContainer, content);
      column.append(box);
      container.append(column);
    });
  };

  const normalizeContact = (item) => {
    const inferredType =
      item.type === "github" ||
      item.icon === "bi-github" ||
      /^https?:\/\/(www\.)?github\.com\//i.test(item.url ?? item.href ?? "")
        ? "github"
        : "email";
    if (inferredType === "github") {
      const url = item.url ?? item.href ?? "";
      return {
        ...item,
        type: "github",
        icon: "bi-github",
        social_icon: "bi-github",
        text: item.text ?? item.label ?? "GitHub",
        url,
        href: url,
      };
    }

    const hrefEmail = String(item.href ?? "").replace(/^mailto:/i, "");
    const email = item.email || hrefEmail || item.text || "";
    return {
      ...item,
      type: "email",
      icon: "bi-envelope",
      social_icon: "bi-envelope",
      text: email || item.text || "",
      email,
      href: email ? `mailto:${email}` : "",
    };
  };

  const getPublicAssetUrl = (path) => {
    if (!path || !client || !siteAssetsBucket) {
      return "";
    }
    const { data } = client.storage.from(siteAssetsBucket).getPublicUrl(path);
    return getSafeUrl(data?.publicUrl);
  };

  const applyAssets = (content) => {
    const aboutLogo = document.querySelector("#aboutLogoImage");
    const activityBand = document.querySelector("#counter");
    const contact = document.querySelector("#contact");
    const favicon = document.querySelector("#siteFavicon");
    const appleTouchIcon = document.querySelector("#siteAppleTouchIcon");
    const clubLogoUrl =
      getPublicAssetUrl(content.branding?.club_logo_storage_path) ||
      getSafeUrl("assets/img/esc-logo.png");
    const schoolLogoUrl =
      getPublicAssetUrl(content.branding?.school_logo_storage_path) ||
      getSafeUrl("assets/img/hssh-logo.jpg");
    const clubLogoAlt =
      content.branding?.club_logo_alt ||
      `${content.brand ?? "ESC"} 동아리 로고`;
    const schoolLogoAlt = content.branding?.school_logo_alt || "학교 로고";

    if (aboutLogo) {
      aboutLogo.hidden = !clubLogoUrl;
      aboutLogo.src = clubLogoUrl;
      aboutLogo.alt = clubLogoAlt;
    }
    if (activityBand) {
      activityBand.style.backgroundImage = clubLogoUrl
        ? `url("${clubLogoUrl}")`
        : "none";
      activityBand.setAttribute("aria-label", clubLogoAlt);
    }
    if (contact) {
      contact.style.backgroundImage = schoolLogoUrl
        ? `url("${schoolLogoUrl}")`
        : "none";
      contact.setAttribute("aria-label", schoolLogoAlt);
    }
    if (favicon) {
      favicon.href = clubLogoUrl;
    }
    if (appleTouchIcon) {
      appleTouchIcon.href = clubLogoUrl;
    }
  };

  const applyContent = (content) => {
    document.documentElement.lang = "ko";
    document.title = content.meta?.title ?? "ESC";
    setMetaContent("description", content.meta?.description ?? "");
    setMetaContent("keywords", content.meta?.keywords ?? "");
    const contactOverlayColor = /^#[0-9a-f]{6}$/i.test(
      content.appearance?.contact_overlay_color ?? "",
    )
      ? content.appearance.contact_overlay_color
      : "#8b5cf6";
    document.documentElement.style.setProperty(
      "--contact-overlay-color",
      contactOverlayColor,
    );

    setText("#siteBrand", content.brand);
    setText("#navHome", content.navigation?.home);
    setText("#navAbout", content.navigation?.about);
    setText("#navActivities", content.navigation?.activities);
    setText("#navPortfolio", content.navigation?.portfolio);
    setText("#navContact", content.navigation?.contact);
    setText("#heroTitle", content.hero?.title);

    const typed = document.querySelector(".typed");
    if (typed && Array.isArray(content.hero?.typed_items)) {
      typed.dataset.typedItemsJson = JSON.stringify(
        content.hero.typed_items.filter(
          (item) => typeof item === "string" && item.trim(),
        ),
      );
    }

    setText("#aboutTitle", content.about?.title);
    renderAbout(content.about ?? {});
    setText("#servicesTitle", content.activity_plans?.title);
    setText(
      "#servicesSubtitle",
      year.renderYearTemplate(content.activity_plans?.subtitle),
    );
    renderActivityPlans(
      content.activity_plans ?? {},
      content.about?.school_url,
    );
    setText("#portfolioTitle", content.portfolio?.title);
    setText("#contactTitle", content.contact?.title);
    const contactIntro = document.querySelector("#contactIntro");
    if (contactIntro) {
      appendMarkdown(contactIntro, content.contact?.intro ?? "");
    }
    setText("#footerCopyrightName", content.footer?.copyright_name);
    setText("#footerRights", content.footer?.rights_text);
    setText("#footerAdminLabel", content.footer?.admin_label);
    setText(".copyright-year", year.getCurrentKoreanYear());

    window.ESC_CONTENT.site = content;
    window.ESC_CONTENT.contacts = Array.isArray(content.contact?.items)
      ? content.contact.items.map(normalizeContact)
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
    applyAssets(content);

    try {
      content = await loadContent();
      applyContent(content);
      applyAssets(content);
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
    applyAssets,
    fallbackContent: clone(fallbackContent),
    loadContent,
    mergeContent,
  };
  window.ESC_SITE_CONTENT_READY = loadAndApply();
})();
