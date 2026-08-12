(function () {
  "use strict";

  const client = window.ESC_SUPABASE;
  const bucket = window.ESC_SUPABASE_CONFIG?.activityBucket;
  const siteAssetsBucket = window.ESC_SUPABASE_CONFIG?.siteAssetsBucket;
  const fallbackSiteContent = window.ESC_CONTENT?.site ?? {};
  const year = window.ESC_YEAR;
  const maxImageSize = 6 * 1024 * 1024;
  const signedUrlLifetimeSeconds = 60 * 60;
  const allowedImageTypes = new Set([
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  const extensionByMimeType = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const iconOptions = [
    ["bi-stars", "별"],
    ["bi-mortarboard-fill", "교육"],
    ["bi-people-fill", "교류"],
    ["bi-shop-window", "부스"],
    ["bi-robot", "인공지능"],
    ["bi-code-slash", "프로그래밍"],
    ["bi-git", "Git"],
    ["bi-envelope", "이메일"],
    ["bi-github", "GitHub"],
    ["bi-globe2", "웹사이트"],
    ["bi-instagram", "Instagram"],
    ["bi-link-45deg", "링크"],
  ];

  const elements = {
    activityAdminView: document.querySelector("#activityAdminView"),
    activityCount: document.querySelector("#activityCount"),
    activityDate: document.querySelector("#activityDate"),
    activityDescription: document.querySelector("#activityDescription"),
    activityForm: document.querySelector("#activityForm"),
    activityIcon: document.querySelector("#activityIcon"),
    activityIconPreview: document.querySelector("#activityIconPreview"),
    activityId: document.querySelector("#activityId"),
    activityList: document.querySelector("#activityList"),
    activityPublished: document.querySelector("#activityPublished"),
    activityTags: document.querySelector("#activityTags"),
    activityTitle: document.querySelector("#activityTitle"),
    activityTypeSelect: document.querySelector("#activityTypeSelect"),
    activityUrl: document.querySelector("#activityUrl"),
    activityViewTab: document.querySelector("#activityViewTab"),
    addContactItemButton: document.querySelector("#addContactItemButton"),
    addServiceItemButton: document.querySelector("#addServiceItemButton"),
    adminEmail: document.querySelector("#adminEmail"),
    aboutParagraphs: document.querySelector("#aboutParagraphs"),
    aboutPlans: document.querySelector("#aboutPlans"),
    aboutSchoolUrl: document.querySelector("#aboutSchoolUrl"),
    aboutTitleText: document.querySelector("#aboutTitleText"),
    contactContentItems: document.querySelector("#contactContentItems"),
    contactIntroText: document.querySelector("#contactIntroText"),
    contactOverlayColor: document.querySelector("#contactOverlayColor"),
    contactOverlayColorValue: document.querySelector(
      "#contactOverlayColorValue",
    ),
    contactTitleText: document.querySelector("#contactTitleText"),
    clubLogoAlt: document.querySelector("#clubLogoAlt"),
    clubLogoFile: document.querySelector("#clubLogoFile"),
    clubLogoPreview: document.querySelector("#clubLogoPreview"),
    dashboardSection: document.querySelector("#dashboardSection"),
    deleteActivityButton: document.querySelector("#deleteActivityButton"),
    editorKicker: document.querySelector("#editorKicker"),
    editorTitle: document.querySelector("#editorTitle"),
    existingPhotos: document.querySelector("#existingPhotos"),
    globalMessage: document.querySelector("#globalMessage"),
    footerAdminLabel: document.querySelector("#footerAdminLabel"),
    footerCopyrightName: document.querySelector("#footerCopyrightName"),
    footerRightsText: document.querySelector("#footerRightsText"),
    heroTitleText: document.querySelector("#heroTitleText"),
    heroTypedItems: document.querySelector("#heroTypedItems"),
    loginButton: document.querySelector("#loginButton"),
    loginEmail: document.querySelector("#loginEmail"),
    loginForm: document.querySelector("#loginForm"),
    loginPassword: document.querySelector("#loginPassword"),
    loginSection: document.querySelector("#loginSection"),
    logoutButton: document.querySelector("#logoutButton"),
    newActivityButton: document.querySelector("#newActivityButton"),
    newPhotoList: document.querySelector("#newPhotoList"),
    newPhotos: document.querySelector("#newPhotos"),
    navAboutText: document.querySelector("#navAboutText"),
    navActivitiesText: document.querySelector("#navActivitiesText"),
    navContactText: document.querySelector("#navContactText"),
    navHomeText: document.querySelector("#navHomeText"),
    navPortfolioText: document.querySelector("#navPortfolioText"),
    portfolioTitleText: document.querySelector("#portfolioTitleText"),
    resetActivityButton: document.querySelector("#resetActivityButton"),
    resetSiteContentButton: document.querySelector("#resetSiteContentButton"),
    removeClubLogoButton: document.querySelector("#removeClubLogoButton"),
    removeSchoolLogoButton: document.querySelector("#removeSchoolLogoButton"),
    saveActivityButton: document.querySelector("#saveActivityButton"),
    serviceContentItems: document.querySelector("#serviceContentItems"),
    servicesSubtitleText: document.querySelector("#servicesSubtitleText"),
    servicesTitleText: document.querySelector("#servicesTitleText"),
    siteBrand: document.querySelector("#siteBrand"),
    siteContentAdminView: document.querySelector("#siteContentAdminView"),
    siteContentForm: document.querySelector("#siteContentForm"),
    siteContentViewTab: document.querySelector("#siteContentViewTab"),
    siteMetaDescription: document.querySelector("#siteMetaDescription"),
    siteMetaKeywords: document.querySelector("#siteMetaKeywords"),
    siteMetaTitle: document.querySelector("#siteMetaTitle"),
    schoolLogoAlt: document.querySelector("#schoolLogoAlt"),
    schoolLogoFile: document.querySelector("#schoolLogoFile"),
    schoolLogoPreview: document.querySelector("#schoolLogoPreview"),
  };

  const state = {
    activities: [],
    currentUser: null,
    newFiles: [],
    photos: [],
    previewUrls: [],
    selectedActivityId: null,
    siteContentSaveInProgress: false,
    siteContent: null,
    logoFiles: { club: null, school: null },
    logoPreviewUrls: { club: null, school: null },
    removeLogos: { club: false, school: false },
  };

  const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  const clone = (value) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));

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

  const normalizeSiteContent = (content) => {
    const normalized = clone(content ?? {});
    if (!isPlainObject(normalized.about)) {
      normalized.about = {};
    }

    if (typeof normalized.about.body_markdown !== "string") {
      normalized.about.body_markdown = Array.isArray(
        normalized.about.paragraphs,
      )
        ? normalized.about.paragraphs.join("\n\n")
        : "";
    }
    if (typeof normalized.about.plans_markdown !== "string") {
      normalized.about.plans_markdown = Array.isArray(normalized.about.plans)
        ? normalized.about.plans.map((item) => `- ${item}`).join("\n")
        : "";
    }
    normalized.about.body_markdown = year.normalizeYearTemplate(
      normalized.about.body_markdown,
    );
    if (typeof normalized.activity_plans?.subtitle === "string") {
      normalized.activity_plans.subtitle = year.normalizeYearTemplate(
        normalized.activity_plans.subtitle,
      );
    }
    delete normalized.about.paragraphs;
    delete normalized.about.plans;
    return normalized;
  };

  const splitLines = (value) =>
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  const createIconSelect = (value, className) => {
    const select = document.createElement("select");
    select.className = `form-select ${className}`;
    iconOptions.forEach(([icon, label]) => {
      const option = document.createElement("option");
      option.value = icon;
      option.textContent = label;
      select.append(option);
    });
    select.value = iconOptions.some(([icon]) => icon === value)
      ? value
      : "bi-stars";
    return select;
  };

  const getIconLabel = (value) =>
    iconOptions.find(([icon]) => icon === value)?.[1] ?? "아이콘";

  const updateIconPreview = (select, preview) => {
    const icon = preview.querySelector("i");
    const label = preview.querySelector("span");
    icon.className = `bi ${select.value}`;
    label.textContent = getIconLabel(select.value);
  };

  const createIconPicker = (select) => {
    const picker = document.createElement("div");
    picker.className = "icon-picker";
    const preview = document.createElement("span");
    preview.className = "icon-preview";
    const icon = document.createElement("i");
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    preview.append(icon, label);
    picker.append(select, preview);
    updateIconPreview(select, preview);
    select.addEventListener("change", () => updateIconPreview(select, preview));
    return picker;
  };

  const activateAdminView = (view) => {
    const showActivities = view === "activities";
    const showContent = view === "content";
    elements.activityAdminView.hidden = !showActivities;
    elements.siteContentAdminView.hidden = !showContent;
    elements.activityViewTab.classList.toggle("active", showActivities);
    elements.siteContentViewTab.classList.toggle("active", showContent);
    elements.activityViewTab.setAttribute(
      "aria-selected",
      String(showActivities),
    );
    elements.siteContentViewTab.setAttribute(
      "aria-selected",
      String(showContent),
    );
  };

  const setMessage = (message, type = "info") => {
    elements.globalMessage.className = `alert alert-${type} admin-message`;
    elements.globalMessage.textContent = message;
    elements.globalMessage.hidden = false;
  };

  const clearMessage = () => {
    elements.globalMessage.hidden = true;
    elements.globalMessage.textContent = "";
  };

  const setLoginBusy = (busy) => {
    elements.loginButton.disabled = busy;
    elements.loginEmail.disabled = busy;
    elements.loginPassword.disabled = busy;
    elements.loginButton.textContent = busy ? "확인 중..." : "로그인";
  };

  const setEditorBusy = (busy) => {
    elements.activityForm.setAttribute("aria-busy", String(busy));
    elements.activityForm
      .querySelectorAll("input, textarea, select, button")
      .forEach((element) => {
        element.disabled = busy;
      });
    elements.newActivityButton.disabled = busy;
    elements.saveActivityButton.textContent = busy ? "저장 중..." : "저장";
  };

  const setSiteContentBusy = (sectionName, busy) => {
    const section = elements.siteContentForm.querySelector(
      `[data-content-section="${sectionName}"]`,
    );
    if (!section) {
      return;
    }
    section.setAttribute("aria-busy", String(busy));
    section
      .querySelectorAll("input, textarea, select, button")
      .forEach((element) => {
        element.disabled = busy;
      });
    const saveButton = section.querySelector(".save-content-section");
    if (saveButton) {
      saveButton.dataset.defaultLabel ||= saveButton.textContent.trim();
      saveButton.textContent = busy
        ? "저장 중..."
        : saveButton.dataset.defaultLabel;
    }
    elements.siteContentForm
      .querySelectorAll(".save-content-section")
      .forEach((button) => {
        button.disabled = busy;
      });
  };

  const getActivityPhotos = (activityId) =>
    state.photos.filter((photo) => photo.activity_id === activityId);

  const getPhotoUrl = (photo) => photo.signed_url ?? "";

  const addSignedPhotoUrls = async (photos) => {
    const paths = [
      ...new Set(photos.map((photo) => photo.storage_path).filter(Boolean)),
    ];

    if (!paths.length) {
      return photos;
    }

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrls(paths, signedUrlLifetimeSeconds);

    if (error) {
      throw error;
    }

    const urls = new Map();
    data.forEach((result, index) => {
      if (result.error || !result.signedUrl) {
        throw result.error ?? new Error("A signed image URL is missing.");
      }
      urls.set(result.path ?? paths[index], result.signedUrl);
    });

    return photos.map((photo) => ({
      ...photo,
      signed_url: photo.storage_path
        ? (urls.get(photo.storage_path) ?? "")
        : null,
    }));
  };

  const createUuid = () => {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  };

  const revokePreviewUrls = () => {
    state.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    state.previewUrls = [];
  };

  const renderActivityList = () => {
    elements.activityList.replaceChildren();
    elements.activityCount.textContent = `${state.activities.length}개`;

    if (!state.activities.length) {
      const empty = document.createElement("p");
      empty.className = "empty-admin-list";
      empty.textContent = "등록된 활동이 없습니다.";
      elements.activityList.append(empty);
      return;
    }

    state.activities.forEach((activity) => {
      const button = document.createElement("button");
      button.className = "activity-admin-item";
      button.type = "button";
      button.classList.toggle(
        "active",
        activity.id === state.selectedActivityId,
      );
      button.setAttribute(
        "aria-pressed",
        String(activity.id === state.selectedActivityId),
      );

      const title = document.createElement("span");
      title.className = "activity-admin-item-title";
      title.textContent = activity.title;

      const meta = document.createElement("span");
      meta.className = "activity-admin-item-meta";

      const date = document.createElement("span");
      date.textContent = activity.activity_date;

      const status = document.createElement("span");
      status.className = `activity-status ${
        activity.is_published ? "published" : "draft"
      }`;
      status.textContent = activity.is_published ? "공개" : "비공개";

      meta.append(date, status);
      button.append(title, meta);
      button.addEventListener("click", () => selectActivity(activity.id));
      elements.activityList.append(button);
    });
  };

  const renderExistingPhotos = () => {
    elements.existingPhotos.replaceChildren();
    const photos = getActivityPhotos(state.selectedActivityId);

    if (!photos.length) {
      const empty = document.createElement("p");
      empty.className = "empty-admin-list";
      empty.textContent = "등록된 사진이 없습니다.";
      elements.existingPhotos.append(empty);
      return;
    }

    photos.forEach((photo) => {
      const row = document.createElement("div");
      row.className = "photo-admin-row existing-photo-row";
      row.dataset.photoId = photo.id;

      const image = document.createElement("img");
      image.src = getPhotoUrl(photo);
      image.alt = photo.caption || "활동 사진";

      const fieldContainer = document.createElement("div");
      const fields = document.createElement("div");
      fields.className = "photo-admin-fields";

      const captionGroup = document.createElement("div");
      const captionLabel = document.createElement("label");
      captionLabel.htmlFor = `caption-${photo.id}`;
      captionLabel.textContent = "사진 설명";
      const captionInput = document.createElement("input");
      captionInput.className = "form-control form-control-sm photo-caption";
      captionInput.id = `caption-${photo.id}`;
      captionInput.maxLength = 500;
      captionInput.value = photo.caption ?? "";
      captionGroup.append(captionLabel, captionInput);

      const orderGroup = document.createElement("div");
      const orderLabel = document.createElement("label");
      orderLabel.htmlFor = `order-${photo.id}`;
      orderLabel.textContent = "순서";
      const orderInput = document.createElement("input");
      orderInput.className = "form-control form-control-sm photo-order";
      orderInput.id = `order-${photo.id}`;
      orderInput.type = "number";
      orderInput.min = "0";
      orderInput.step = "1";
      orderInput.value = String(photo.display_order);
      orderGroup.append(orderLabel, orderInput);

      const source = document.createElement("p");
      source.className = "photo-source-note";
      source.textContent = "Supabase Storage 이미지";

      fields.append(captionGroup, orderGroup);
      fieldContainer.append(fields, source);

      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-sm btn-outline-danger";
      deleteButton.type = "button";
      deleteButton.textContent = "사진 삭제";
      deleteButton.addEventListener("click", () => deletePhoto(photo));

      row.append(image, fieldContainer, deleteButton);
      elements.existingPhotos.append(row);
    });
  };

  const renderNewPhotos = () => {
    revokePreviewUrls();
    elements.newPhotoList.replaceChildren();

    state.newFiles.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "photo-admin-row";

      const image = document.createElement("img");
      const previewUrl = URL.createObjectURL(entry.file);
      state.previewUrls.push(previewUrl);
      image.src = previewUrl;
      image.alt = `${entry.file.name} 미리보기`;

      const fieldContainer = document.createElement("div");
      const captionLabel = document.createElement("label");
      captionLabel.className = "form-label mb-1";
      captionLabel.htmlFor = `new-caption-${index}`;
      captionLabel.textContent = "사진 설명";
      const captionInput = document.createElement("input");
      captionInput.className = "form-control form-control-sm";
      captionInput.id = `new-caption-${index}`;
      captionInput.maxLength = 500;
      captionInput.placeholder = "이 사진에 대한 설명";
      captionInput.value = entry.caption;
      captionInput.addEventListener("input", (event) => {
        state.newFiles[index].caption = event.target.value;
      });
      const fileName = document.createElement("p");
      fileName.className = "new-photo-name";
      fileName.textContent = entry.file.name;
      fieldContainer.append(captionLabel, captionInput, fileName);

      const removeButton = document.createElement("button");
      removeButton.className = "btn btn-sm btn-outline-secondary";
      removeButton.type = "button";
      removeButton.textContent = "선택 취소";
      removeButton.addEventListener("click", () => {
        state.newFiles.splice(index, 1);
        renderNewPhotos();
      });

      row.append(image, fieldContainer, removeButton);
      elements.newPhotoList.append(row);
    });
  };

  const renderRepeatEmptyState = (container, message) => {
    if (container.children.length) {
      return;
    }

    const empty = document.createElement("p");
    empty.className = "content-empty-state";
    empty.textContent = message;
    container.append(empty);
  };

  const renumberRepeatItems = (container, label) => {
    container.querySelectorAll(".content-repeat-item").forEach((row, index) => {
      row.querySelector(".content-repeat-item-heading strong").textContent =
        `${label} ${index + 1}`;
    });
  };

  const appendServiceContentItem = (item = {}) => {
    elements.serviceContentItems
      .querySelector(".content-empty-state")
      ?.remove();

    const row = document.createElement("div");
    row.className = "content-repeat-item service-content-row";

    const heading = document.createElement("div");
    heading.className = "content-repeat-item-heading";
    const label = document.createElement("strong");
    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-sm btn-outline-danger";
    removeButton.type = "button";
    removeButton.textContent = "카드 삭제";
    removeButton.addEventListener("click", () => {
      row.remove();
      renumberRepeatItems(elements.serviceContentItems, "계획 카드");
      renderRepeatEmptyState(
        elements.serviceContentItems,
        "등록된 활동 계획 카드가 없습니다.",
      );
    });
    heading.append(label, removeButton);

    const fields = document.createElement("div");
    fields.className = "row g-3";

    const titleColumn = document.createElement("div");
    titleColumn.className = "col-md-7";
    const titleLabel = document.createElement("label");
    titleLabel.className = "form-label";
    titleLabel.textContent = "카드 제목";
    const titleInput = document.createElement("input");
    titleInput.className = "form-control service-item-title";
    titleInput.maxLength = 120;
    titleInput.required = true;
    titleInput.value = item.title ?? "";
    titleColumn.append(titleLabel, titleInput);

    const iconColumn = document.createElement("div");
    iconColumn.className = "col-md-5";
    const iconLabel = document.createElement("label");
    iconLabel.className = "form-label";
    iconLabel.textContent = "아이콘";
    const iconSelect = createIconSelect(
      item.icon ?? "bi-stars",
      "service-item-icon",
    );
    iconColumn.append(iconLabel, createIconPicker(iconSelect));

    const descriptionColumn = document.createElement("div");
    descriptionColumn.className = "col-12";
    const descriptionLabel = document.createElement("label");
    descriptionLabel.className = "form-label";
    descriptionLabel.textContent = "카드 설명";
    const descriptionInput = document.createElement("textarea");
    descriptionInput.className = "form-control service-item-description";
    descriptionInput.maxLength = 1000;
    descriptionInput.rows = 3;
    descriptionInput.required = true;
    descriptionInput.value = item.description ?? "";
    const descriptionHelp = document.createElement("div");
    descriptionHelp.className = "form-text";
    descriptionHelp.textContent = "Markdown을 사용할 수 있습니다.";
    descriptionColumn.append(
      descriptionLabel,
      descriptionInput,
      descriptionHelp,
    );

    fields.append(titleColumn, iconColumn, descriptionColumn);
    row.append(heading, fields);
    elements.serviceContentItems.append(row);
    renumberRepeatItems(elements.serviceContentItems, "계획 카드");
  };

  const appendContactContentItem = (item = {}) => {
    elements.contactContentItems
      .querySelector(".content-empty-state")
      ?.remove();

    const row = document.createElement("div");
    row.className = "content-repeat-item contact-content-row";

    const heading = document.createElement("div");
    heading.className = "content-repeat-item-heading";
    const label = document.createElement("strong");
    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-sm btn-outline-danger";
    removeButton.type = "button";
    removeButton.textContent = "연락처 삭제";
    removeButton.addEventListener("click", () => {
      row.remove();
      renumberRepeatItems(elements.contactContentItems, "연락처");
      renderRepeatEmptyState(
        elements.contactContentItems,
        "등록된 연락처가 없습니다.",
      );
    });
    heading.append(label, removeButton);

    const fields = document.createElement("div");
    fields.className = "row g-3";
    const inferredType =
      item.type === "github" ||
      item.icon === "bi-github" ||
      /github\.com/i.test(item.url ?? item.href ?? "")
        ? "github"
        : "email";

    const typeColumn = document.createElement("div");
    typeColumn.className = "col-md-4";
    const typeLabel = document.createElement("label");
    typeLabel.className = "form-label";
    typeLabel.textContent = "연락처 유형";
    const typeSelect = document.createElement("select");
    typeSelect.className = "form-select contact-item-type";
    [
      ["email", "개인 연락처(이메일)"],
      ["github", "GitHub"],
    ].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      typeSelect.append(option);
    });
    typeSelect.value = inferredType;
    typeColumn.append(typeLabel, typeSelect);

    const nameColumn = document.createElement("div");
    nameColumn.className = "col-md-4";
    const nameLabel = document.createElement("label");
    nameLabel.className = "form-label contact-item-name-label";
    const nameInput = document.createElement("input");
    nameInput.className = "form-control contact-item-name";
    nameInput.type = "text";
    nameInput.maxLength = 160;
    nameInput.required = true;
    nameInput.value =
      inferredType === "github"
        ? (item.text ?? item.label ?? "")
        : (item.label ?? "");
    nameColumn.append(nameLabel, nameInput);

    const valueColumn = document.createElement("div");
    valueColumn.className = "col-md-4";
    const valueLabel = document.createElement("label");
    valueLabel.className = "form-label contact-item-value-label";
    const valueInput = document.createElement("input");
    valueInput.className = "form-control contact-item-value";
    valueInput.required = true;
    valueInput.value =
      inferredType === "github"
        ? (item.url ?? item.href ?? "")
        : (item.email ?? item.text ?? "");
    valueColumn.append(valueLabel, valueInput);

    const iconColumn = document.createElement("div");
    iconColumn.className = "col-md-5";
    const iconLabel = document.createElement("label");
    iconLabel.className = "form-label";
    iconLabel.textContent = "아이콘 미리보기";
    const iconPreview = document.createElement("span");
    iconPreview.className = "icon-preview contact-item-icon-preview";
    iconPreview.append(
      document.createElement("i"),
      document.createElement("span"),
    );
    iconColumn.append(iconLabel, iconPreview);

    const socialColumn = document.createElement("div");
    socialColumn.className =
      "col-md-7 d-flex align-items-end pb-2 contact-social-column";
    const socialGroup = document.createElement("div");
    socialGroup.className = "form-check form-switch";
    const socialInput = document.createElement("input");
    socialInput.className = "form-check-input contact-item-social";
    socialInput.type = "checkbox";
    socialInput.checked = Boolean(item.social);
    const socialLabel = document.createElement("label");
    socialLabel.className = "form-check-label";
    socialLabel.textContent = "원형 소셜 아이콘에도 표시";
    socialGroup.append(socialInput, socialLabel);
    socialColumn.append(socialGroup);

    const updateContactFields = () => {
      const github = typeSelect.value === "github";
      nameLabel.textContent = github ? "GitHub 이름" : "이름";
      valueLabel.textContent = github ? "GitHub 링크" : "이메일 주소";
      valueInput.type = github ? "url" : "email";
      valueInput.maxLength = github ? 2000 : 320;
      valueInput.placeholder = github
        ? "https://github.com/..."
        : "name@example.com";
      const iconValue = github ? "bi-github" : "bi-envelope";
      const previewIcon = iconPreview.querySelector("i");
      previewIcon.className = `bi ${iconValue}`;
      previewIcon.setAttribute("aria-hidden", "true");
      iconPreview.querySelector("span").textContent = github
        ? "GitHub"
        : "이메일";
      valueInput.setCustomValidity("");
    };
    const validateContactValue = () => {
      if (typeSelect.value !== "github" || !valueInput.value) {
        valueInput.setCustomValidity("");
        return;
      }
      try {
        const url = new URL(valueInput.value);
        const valid =
          url.protocol === "https:" &&
          ["github.com", "www.github.com"].includes(url.hostname);
        valueInput.setCustomValidity(
          valid ? "" : "https://github.com/으로 시작하는 링크를 입력해 주세요.",
        );
      } catch {
        valueInput.setCustomValidity("올바른 GitHub 링크를 입력해 주세요.");
      }
    };
    typeSelect.addEventListener("change", updateContactFields);
    typeSelect.addEventListener("change", validateContactValue);
    valueInput.addEventListener("input", validateContactValue);
    updateContactFields();
    validateContactValue();

    const generatedLinkNote = document.createElement("p");
    generatedLinkNote.className = "contact-type-note";
    generatedLinkNote.textContent =
      "이메일 연락처의 메일 링크는 입력한 이메일 주소로 자동 생성됩니다.";

    fields.append(
      typeColumn,
      nameColumn,
      valueColumn,
      iconColumn,
      socialColumn,
    );
    row.append(heading, fields);
    row.append(generatedLinkNote);
    elements.contactContentItems.append(row);
    renumberRepeatItems(elements.contactContentItems, "연락처");
  };

  const logoFields = {
    club: {
      file: elements.clubLogoFile,
      pathKey: "club_logo_storage_path",
      preview: elements.clubLogoPreview,
      removeButton: elements.removeClubLogoButton,
    },
    school: {
      file: elements.schoolLogoFile,
      pathKey: "school_logo_storage_path",
      preview: elements.schoolLogoPreview,
      removeButton: elements.removeSchoolLogoButton,
    },
  };

  const revokeLogoPreview = (kind) => {
    if (state.logoPreviewUrls[kind]) {
      URL.revokeObjectURL(state.logoPreviewUrls[kind]);
      state.logoPreviewUrls[kind] = null;
    }
  };

  const getPublicAssetUrl = (path) => {
    if (!path) {
      return "";
    }
    return client.storage.from(siteAssetsBucket).getPublicUrl(path).data
      .publicUrl;
  };

  const refreshLogoPreview = (kind) => {
    const fields = logoFields[kind];
    revokeLogoPreview(kind);
    const currentPath = state.siteContent?.branding?.[fields.pathKey] ?? "";
    let previewUrl = "";

    if (state.logoFiles[kind]) {
      state.logoPreviewUrls[kind] = URL.createObjectURL(state.logoFiles[kind]);
      previewUrl = state.logoPreviewUrls[kind];
    } else if (!state.removeLogos[kind] && currentPath) {
      previewUrl = getPublicAssetUrl(currentPath);
    } else if (!state.removeLogos[kind]) {
      previewUrl =
        kind === "club"
          ? "assets/img/esc-logo.png"
          : "assets/img/hssh-logo.jpg";
    }

    if (previewUrl) {
      fields.preview.src = previewUrl;
    } else {
      fields.preview.removeAttribute("src");
    }
    fields.removeButton.hidden = !(
      state.logoFiles[kind] ||
      (!state.removeLogos[kind] && currentPath)
    );
  };

  const renderSiteContentForm = () => {
    const content = state.siteContent ?? fallbackSiteContent;
    elements.siteMetaTitle.value = content.meta?.title ?? "";
    elements.siteMetaDescription.value = content.meta?.description ?? "";
    elements.siteMetaKeywords.value = content.meta?.keywords ?? "";
    elements.siteBrand.value = content.brand ?? "";
    elements.clubLogoAlt.value =
      content.branding?.club_logo_alt ??
      `${content.brand ?? "ESC"} 동아리 로고`;
    elements.schoolLogoAlt.value =
      content.branding?.school_logo_alt ?? "학교 로고";
    elements.navHomeText.value = content.navigation?.home ?? "";
    elements.navAboutText.value = content.navigation?.about ?? "";
    elements.navActivitiesText.value = content.navigation?.activities ?? "";
    elements.navPortfolioText.value = content.navigation?.portfolio ?? "";
    elements.navContactText.value = content.navigation?.contact ?? "";
    elements.heroTitleText.value = content.hero?.title ?? "";
    elements.heroTypedItems.value = (content.hero?.typed_items ?? []).join(
      "\n",
    );
    elements.aboutTitleText.value = content.about?.title ?? "";
    elements.aboutSchoolUrl.value = content.about?.school_url ?? "";
    elements.aboutParagraphs.value =
      content.about?.body_markdown ??
      (content.about?.paragraphs ?? []).join("\n\n");
    elements.aboutPlans.value =
      content.about?.plans_markdown ??
      (content.about?.plans ?? []).map((item) => `- ${item}`).join("\n");
    elements.servicesTitleText.value = content.activity_plans?.title ?? "";
    elements.servicesSubtitleText.value =
      content.activity_plans?.subtitle ?? "";
    elements.portfolioTitleText.value = content.portfolio?.title ?? "";
    elements.contactTitleText.value = content.contact?.title ?? "";
    elements.contactIntroText.value = content.contact?.intro ?? "";
    const overlayColor = /^#[0-9a-f]{6}$/i.test(
      content.appearance?.contact_overlay_color ?? "",
    )
      ? content.appearance.contact_overlay_color
      : "#8b5cf6";
    elements.contactOverlayColor.value = overlayColor;
    elements.contactOverlayColorValue.value = overlayColor.toUpperCase();
    elements.footerCopyrightName.value = content.footer?.copyright_name ?? "";
    elements.footerRightsText.value = content.footer?.rights_text ?? "";
    elements.footerAdminLabel.value = content.footer?.admin_label ?? "";

    elements.serviceContentItems.replaceChildren();
    (content.activity_plans?.items ?? []).forEach(appendServiceContentItem);
    renderRepeatEmptyState(
      elements.serviceContentItems,
      "등록된 활동 계획 카드가 없습니다.",
    );

    elements.contactContentItems.replaceChildren();
    (content.contact?.items ?? []).forEach(appendContactContentItem);
    renderRepeatEmptyState(
      elements.contactContentItems,
      "등록된 연락처가 없습니다.",
    );

    for (const kind of Object.keys(logoFields)) {
      state.logoFiles[kind] = null;
      state.removeLogos[kind] = false;
      logoFields[kind].file.value = "";
      refreshLogoPreview(kind);
    }
  };

  const readSiteContentSection = (sectionName) => {
    if (sectionName === "basics") {
      return {
        meta: {
          title: elements.siteMetaTitle.value.trim(),
          description: elements.siteMetaDescription.value.trim(),
          keywords: elements.siteMetaKeywords.value.trim(),
        },
        brand: elements.siteBrand.value.trim(),
        branding: {
          club_logo_alt: elements.clubLogoAlt.value.trim(),
          club_logo_storage_path: state.removeLogos.club
            ? null
            : (state.siteContent?.branding?.club_logo_storage_path ?? null),
          school_logo_alt: elements.schoolLogoAlt.value.trim(),
          school_logo_storage_path: state.removeLogos.school
            ? null
            : (state.siteContent?.branding?.school_logo_storage_path ?? null),
        },
        navigation: {
          home: elements.navHomeText.value.trim(),
          about: elements.navAboutText.value.trim(),
          activities: elements.navActivitiesText.value.trim(),
          portfolio: elements.navPortfolioText.value.trim(),
          contact: elements.navContactText.value.trim(),
        },
      };
    }

    if (sectionName === "introduction") {
      return {
        hero: {
          title: elements.heroTitleText.value.trim(),
          typed_items: splitLines(elements.heroTypedItems.value),
        },
        about: {
          title: elements.aboutTitleText.value.trim(),
          school_url: elements.aboutSchoolUrl.value.trim(),
          body_markdown: elements.aboutParagraphs.value.trim(),
          plans_markdown: elements.aboutPlans.value.trim(),
        },
      };
    }

    if (sectionName === "plans") {
      return {
        activity_plans: {
          title: elements.servicesTitleText.value.trim(),
          subtitle: elements.servicesSubtitleText.value.trim(),
          items: [
            ...elements.serviceContentItems.querySelectorAll(
              ".service-content-row",
            ),
          ].map((row) => ({
            title: row.querySelector(".service-item-title").value.trim(),
            description: row
              .querySelector(".service-item-description")
              .value.trim(),
            icon: row.querySelector(".service-item-icon").value,
          })),
        },
      };
    }

    if (sectionName === "contact") {
      return {
        portfolio: { title: elements.portfolioTitleText.value.trim() },
        appearance: {
          contact_overlay_color: elements.contactOverlayColor.value,
        },
        contact: {
          title: elements.contactTitleText.value.trim(),
          intro: elements.contactIntroText.value.trim(),
          items: [
            ...elements.contactContentItems.querySelectorAll(
              ".contact-content-row",
            ),
          ].map((row) => {
            const type = row.querySelector(".contact-item-type").value;
            const name = row.querySelector(".contact-item-name").value.trim();
            const value = row.querySelector(".contact-item-value").value.trim();
            const social = row.querySelector(".contact-item-social").checked;
            return type === "github"
              ? {
                  type,
                  label: "GitHub",
                  text: name,
                  url: value,
                  icon: "bi-github",
                  social,
                  social_icon: "bi-github",
                }
              : {
                  type,
                  label: name,
                  text: value,
                  email: value,
                  icon: "bi-envelope",
                  social,
                  social_icon: "bi-envelope",
                };
          }),
        },
      };
    }

    return {
      footer: {
        copyright_name: elements.footerCopyrightName.value.trim(),
        rights_text: elements.footerRightsText.value.trim(),
        admin_label: elements.footerAdminLabel.value.trim(),
      },
    };
  };

  const validateContentSection = (sectionName) => {
    const section = elements.siteContentForm.querySelector(
      `[data-content-section="${sectionName}"]`,
    );
    const invalid = [...section.querySelectorAll("input, textarea, select")]
      .filter((field) => !field.disabled)
      .find((field) => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return false;
    }
    if (
      sectionName === "introduction" &&
      !splitLines(elements.heroTypedItems.value).length
    ) {
      setMessage("움직이는 단어를 한 개 이상 입력해 주세요.", "warning");
      return false;
    }
    return true;
  };

  const loadSiteContent = async () => {
    const { data, error } = await client
      .from("site_content")
      .select("content")
      .eq("id", "home")
      .maybeSingle();

    if (error) {
      throw error;
    }

    state.siteContent = normalizeSiteContent(
      mergeContent(fallbackSiteContent, data?.content ?? {}),
    );
    renderSiteContentForm();
  };

  const uploadLogo = async (kind, file) => {
    const extension = extensionByMimeType[file.type];
    const storagePath = `branding/${kind}/${createUuid()}.${extension}`;
    const { error } = await client.storage
      .from(siteAssetsBucket)
      .upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
    if (error) {
      throw error;
    }
    return storagePath;
  };

  const contentSectionLabels = {
    basics: "기본 정보와 메뉴",
    introduction: "첫 화면과 동아리 소개",
    plans: "활동 계획 카드",
    contact: "포트폴리오와 연락처",
    footer: "푸터",
  };

  const handleSaveSiteContentSection = async (sectionName) => {
    if (state.siteContentSaveInProgress) {
      return;
    }
    clearMessage();
    if (!validateContentSection(sectionName)) {
      return;
    }

    state.siteContentSaveInProgress = true;
    setSiteContentBusy(sectionName, true);
    const previousLogoPaths = Object.fromEntries(
      Object.entries(logoFields).map(([kind, fields]) => [
        kind,
        state.siteContent?.branding?.[fields.pathKey] ?? null,
      ]),
    );
    const uploadedLogoPaths = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user) {
        throw userError ?? new Error("Authenticated user is unavailable.");
      }

      const sectionContent = readSiteContentSection(sectionName);
      if (sectionName === "basics") {
        for (const [kind, file] of Object.entries(state.logoFiles)) {
          if (!file) {
            continue;
          }
          const path = await uploadLogo(kind, file);
          uploadedLogoPaths.push(path);
          sectionContent.branding[logoFields[kind].pathKey] = path;
        }
      }
      const nextContent = normalizeSiteContent(
        mergeContent(state.siteContent ?? fallbackSiteContent, sectionContent),
      );
      const { data, error } = await client
        .from("site_content")
        .upsert(
          { id: "home", content: nextContent, updated_by: user.id },
          { onConflict: "id" },
        )
        .select("content")
        .single();
      if (error) {
        throw error;
      }

      state.siteContent = normalizeSiteContent(
        mergeContent(fallbackSiteContent, data.content),
      );
      let cleanupWarning = false;
      if (sectionName === "basics") {
        const pathsToRemove = Object.entries(logoFields).flatMap(
          ([kind, fields]) => {
            const previousPath = previousLogoPaths[kind];
            const currentPath =
              state.siteContent.branding?.[fields.pathKey] ?? null;
            return previousPath && previousPath !== currentPath
              ? [previousPath]
              : [];
          },
        );
        if (pathsToRemove.length) {
          const { error: removeError } = await client.storage
            .from(siteAssetsBucket)
            .remove(pathsToRemove);
          if (removeError) {
            cleanupWarning = true;
            console.error("이전 로고 파일 정리에 실패했습니다.", removeError);
          }
        }
      }

      if (sectionName === "basics") {
        for (const kind of Object.keys(logoFields)) {
          state.logoFiles[kind] = null;
          state.removeLogos[kind] = false;
          logoFields[kind].file.value = "";
          refreshLogoPreview(kind);
        }
      }
      setMessage(
        cleanupWarning
          ? `${contentSectionLabels[sectionName]} 영역은 저장됐지만 이전 로고 파일 정리가 필요합니다.`
          : `${contentSectionLabels[sectionName]} 영역이 저장되었습니다.`,
        cleanupWarning ? "warning" : "success",
      );
    } catch (error) {
      if (uploadedLogoPaths.length) {
        const { error: cleanupError } = await client.storage
          .from(siteAssetsBucket)
          .remove(uploadedLogoPaths);
        if (cleanupError) {
          console.error(
            "실패한 로고 업로드 정리에 실패했습니다.",
            cleanupError,
          );
        }
      }
      console.error("페이지 영역 저장에 실패했습니다.", error);
      setMessage(
        `${contentSectionLabels[sectionName]} 영역을 저장하지 못했습니다. 입력 내용과 네트워크 상태를 확인해 주세요.`,
        "danger",
      );
    } finally {
      setSiteContentBusy(sectionName, false);
      state.siteContentSaveInProgress = false;
    }
  };

  const resetActivityForm = () => {
    state.selectedActivityId = null;
    state.newFiles = [];
    revokePreviewUrls();
    elements.activityForm.reset();
    elements.activityId.value = "";
    elements.activityIcon.value = "bi-stars";
    elements.activityTypeSelect.value = "other";
    updateIconPreview(elements.activityIcon, elements.activityIconPreview);
    elements.activityPublished.checked = true;
    elements.newPhotos.value = "";
    elements.editorKicker.textContent = "새 활동";
    elements.editorTitle.textContent = "활동 등록";
    elements.deleteActivityButton.hidden = true;
    elements.existingPhotos.replaceChildren();
    const empty = document.createElement("p");
    empty.className = "empty-admin-list";
    empty.textContent = "활동을 먼저 저장하면 사진을 관리할 수 있습니다.";
    elements.existingPhotos.append(empty);
    renderNewPhotos();
    renderActivityList();
  };

  const selectActivity = (activityId) => {
    const activity = state.activities.find((item) => item.id === activityId);
    if (!activity) {
      resetActivityForm();
      return;
    }

    state.selectedActivityId = activity.id;
    state.newFiles = [];
    elements.newPhotos.value = "";
    elements.activityId.value = activity.id;
    elements.activityTitle.value = activity.title;
    elements.activityDate.value = activity.activity_date;
    elements.activityDescription.value = activity.description;
    elements.activityTypeSelect.value = activity.activity_type ?? "other";
    elements.activityTags.value = Array.isArray(activity.tags)
      ? activity.tags.join(", ")
      : "";
    elements.activityUrl.value = activity.external_url ?? "";
    elements.activityIcon.value = activity.icon;
    updateIconPreview(elements.activityIcon, elements.activityIconPreview);
    elements.activityPublished.checked = activity.is_published;
    elements.editorKicker.textContent = "활동 수정";
    elements.editorTitle.textContent = activity.title;
    elements.deleteActivityButton.hidden = false;
    renderExistingPhotos();
    renderNewPhotos();
    renderActivityList();
  };

  const loadActivities = async (preferredActivityId = null) => {
    const [activitiesResult, photosResult] = await Promise.all([
      client
        .from("activities")
        .select(
          "id,title,description,activity_date,external_url,icon,is_published,activity_type,tags,created_by,created_at,updated_at",
        )
        .order("activity_date", { ascending: false })
        .order("created_at", { ascending: false }),
      client
        .from("activity_photos")
        .select(
          "id,activity_id,storage_path,caption,display_order,created_by,created_at,updated_at",
        )
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (activitiesResult.error) {
      throw activitiesResult.error;
    }
    if (photosResult.error) {
      throw photosResult.error;
    }

    state.activities = activitiesResult.data;
    state.photos = await addSignedPhotoUrls(photosResult.data);

    const nextActivityId =
      preferredActivityId ??
      state.selectedActivityId ??
      state.activities[0]?.id ??
      null;

    if (
      nextActivityId &&
      state.activities.some((activity) => activity.id === nextActivityId)
    ) {
      selectActivity(nextActivityId);
    } else {
      resetActivityForm();
    }
  };

  const showLogin = () => {
    state.currentUser = null;
    state.activities = [];
    state.photos = [];
    state.selectedActivityId = null;
    state.newFiles = [];
    state.siteContent = null;
    revokePreviewUrls();
    Object.keys(state.logoPreviewUrls).forEach(revokeLogoPreview);
    elements.loginSection.hidden = false;
    elements.dashboardSection.hidden = true;
    elements.logoutButton.hidden = true;
    elements.adminEmail.hidden = true;
    elements.adminEmail.textContent = "";
    elements.loginPassword.value = "";
    activateAdminView("activities");
  };

  const authorizeUser = async (user) => {
    const { data, error } = await client
      .from("site_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      await client.auth.signOut();
      showLogin();
      setMessage("이 계정에는 관리자 권한이 없습니다.", "danger");
      return false;
    }

    state.currentUser = user;
    elements.loginSection.hidden = true;
    elements.dashboardSection.hidden = false;
    elements.logoutButton.hidden = false;
    elements.adminEmail.hidden = false;
    elements.adminEmail.textContent = user.email ?? "관리자";
    await Promise.all([loadActivities(), loadSiteContent()]);
    activateAdminView("activities");
    return true;
  };

  const saveExistingPhotoMetadata = async () => {
    const rows = [...document.querySelectorAll(".existing-photo-row")];
    const updates = rows.map((row) => {
      const photo = state.photos.find(
        (item) => item.id === row.dataset.photoId,
      );
      if (!photo) {
        throw new Error("An activity photo could not be found.");
      }
      const caption = row.querySelector(".photo-caption").value.trim();
      const parsedOrder = Number.parseInt(
        row.querySelector(".photo-order").value,
        10,
      );
      const displayOrder = Number.isNaN(parsedOrder)
        ? 0
        : Math.max(0, parsedOrder);

      return {
        id: photo.id,
        activity_id: photo.activity_id,
        storage_path: photo.storage_path,
        caption,
        display_order: displayOrder,
      };
    });
    if (!updates.length) {
      return;
    }

    const { error } = await client
      .from("activity_photos")
      .upsert(updates, { onConflict: "id" });
    if (error) {
      throw error;
    }
  };

  const cleanupUploadedPaths = async (paths) => {
    if (!paths.length) {
      return;
    }

    const { error } = await client.storage.from(bucket).remove(paths);
    if (error) {
      console.error("업로드 롤백 중 파일 정리에 실패했습니다.", error);
    }
  };

  const uploadNewPhotos = async (activity, user) => {
    if (!state.newFiles.length) {
      return;
    }

    const existingOrders = [...document.querySelectorAll(".photo-order")].map(
      (input) => {
        const parsedOrder = Number.parseInt(input.value, 10);
        return Number.isNaN(parsedOrder) ? 0 : Math.max(0, parsedOrder);
      },
    );
    const firstDisplayOrder = existingOrders.length
      ? Math.max(...existingOrders) + 1
      : 0;
    const uploadedPaths = [];

    const uploadResults = await Promise.allSettled(
      state.newFiles.map(async (entry, index) => {
        const extension = extensionByMimeType[entry.file.type];
        const storagePath = `${activity.id}/${createUuid()}.${extension}`;
        const { error } = await client.storage
          .from(bucket)
          .upload(storagePath, entry.file, {
            cacheControl: "31536000",
            contentType: entry.file.type,
            upsert: false,
          });

        if (error) {
          throw error;
        }

        uploadedPaths.push(storagePath);
        return {
          activity_id: activity.id,
          caption: entry.caption.trim() || `${activity.title} 활동 사진`,
          created_by: user.id,
          display_order: firstDisplayOrder + index,
          storage_path: storagePath,
        };
      }),
    );

    const rejectedUpload = uploadResults.find(
      (result) => result.status === "rejected",
    );
    if (rejectedUpload) {
      await cleanupUploadedPaths(uploadedPaths);
      throw rejectedUpload.reason;
    }

    const photoRows = uploadResults.map((result) => result.value);
    const { error: insertError } = await client
      .from("activity_photos")
      .insert(photoRows);

    if (insertError) {
      await cleanupUploadedPaths(uploadedPaths);
      throw insertError;
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    clearMessage();
    setLoginBusy(true);

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: elements.loginEmail.value.trim(),
        password: elements.loginPassword.value,
      });

      if (error) {
        throw error;
      }

      await authorizeUser(data.user);
    } catch (error) {
      console.error("관리자 로그인에 실패했습니다.", error);
      showLogin();
      setMessage(
        "로그인 정보가 올바르지 않거나 계정을 사용할 수 없습니다.",
        "danger",
      );
    } finally {
      setLoginBusy(false);
    }
  };

  const handleSaveActivity = async (event) => {
    event.preventDefault();
    clearMessage();

    const title = elements.activityTitle.value.trim();
    elements.activityTitle.setCustomValidity(
      title ? "" : "활동명을 입력해 주세요.",
    );

    if (!elements.activityForm.reportValidity()) {
      return;
    }

    setEditorBusy(true);
    let savedActivityId = elements.activityId.value || null;

    try {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("Authenticated user is unavailable.");
      }

      const payload = {
        activity_date: elements.activityDate.value,
        description: elements.activityDescription.value.trim(),
        external_url: elements.activityUrl.value.trim() || null,
        icon: elements.activityIcon.value,
        is_published: elements.activityPublished.checked,
        activity_type: elements.activityTypeSelect.value,
        tags: [
          ...new Set(
            elements.activityTags.value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        ].slice(0, 12),
        title,
      };

      let saveResult;
      if (savedActivityId) {
        saveResult = await client
          .from("activities")
          .update(payload)
          .eq("id", savedActivityId)
          .select("id,title")
          .single();
      } else {
        saveResult = await client
          .from("activities")
          .insert({ ...payload, created_by: user.id })
          .select("id,title")
          .single();
      }

      if (saveResult.error) {
        throw saveResult.error;
      }

      savedActivityId = saveResult.data.id;
      const activity = {
        id: saveResult.data.id,
        title: payload.title,
      };

      await saveExistingPhotoMetadata();
      await uploadNewPhotos(activity, user);

      state.newFiles = [];
      elements.newPhotos.value = "";
      await loadActivities(savedActivityId);
      setMessage("활동 정보가 저장되었습니다.", "success");
    } catch (error) {
      console.error("활동 저장에 실패했습니다.", error);
      setMessage(
        "활동을 저장하지 못했습니다. 입력 내용과 네트워크 상태를 확인해 주세요.",
        "danger",
      );

      try {
        await loadActivities(savedActivityId);
      } catch (reloadError) {
        console.error(
          "저장 실패 후 데이터를 다시 불러오지 못했습니다.",
          reloadError,
        );
      }
    } finally {
      setEditorBusy(false);
    }
  };

  const deletePhoto = async (photo) => {
    const shouldDelete = window.confirm(
      "이 사진과 설명을 활동에서 삭제할까요?",
    );
    if (!shouldDelete) {
      return;
    }

    clearMessage();
    setEditorBusy(true);

    try {
      const { error: deleteError } = await client
        .from("activity_photos")
        .delete()
        .eq("id", photo.id);

      if (deleteError) {
        throw deleteError;
      }

      let storageWarning = false;
      if (photo.storage_path) {
        const { error: storageError } = await client.storage
          .from(bucket)
          .remove([photo.storage_path]);
        storageWarning = Boolean(storageError);
        if (storageError) {
          console.error("Storage 파일 삭제에 실패했습니다.", storageError);
        }
      }

      await loadActivities(state.selectedActivityId);
      setMessage(
        storageWarning
          ? "사진 기록은 삭제했지만 Storage 파일 정리가 필요합니다."
          : "사진이 삭제되었습니다.",
        storageWarning ? "warning" : "success",
      );
    } catch (error) {
      console.error("사진 삭제에 실패했습니다.", error);
      setMessage("사진을 삭제하지 못했습니다.", "danger");
    } finally {
      setEditorBusy(false);
    }
  };

  const handleDeleteActivity = async () => {
    const activity = state.activities.find(
      (item) => item.id === state.selectedActivityId,
    );
    if (!activity) {
      return;
    }

    const shouldDelete = window.confirm(
      `\"${activity.title}\" 활동과 연결된 모든 사진 설명을 삭제할까요?`,
    );
    if (!shouldDelete) {
      return;
    }

    clearMessage();
    setEditorBusy(true);

    try {
      const storagePaths = getActivityPhotos(activity.id)
        .map((photo) => photo.storage_path)
        .filter(Boolean);
      const { error: deleteError } = await client
        .from("activities")
        .delete()
        .eq("id", activity.id);

      if (deleteError) {
        throw deleteError;
      }

      let storageWarning = false;
      if (storagePaths.length) {
        const { error: storageError } = await client.storage
          .from(bucket)
          .remove(storagePaths);
        storageWarning = Boolean(storageError);
        if (storageError) {
          console.error("Storage 파일 정리에 실패했습니다.", storageError);
        }
      }

      state.selectedActivityId = null;
      await loadActivities();
      setMessage(
        storageWarning
          ? "활동은 삭제했지만 일부 Storage 파일 정리가 필요합니다."
          : "활동이 삭제되었습니다.",
        storageWarning ? "warning" : "success",
      );
    } catch (error) {
      console.error("활동 삭제에 실패했습니다.", error);
      setMessage("활동을 삭제하지 못했습니다.", "danger");
    } finally {
      setEditorBusy(false);
    }
  };

  const handlePhotoSelection = (event) => {
    const files = [...event.target.files];
    const acceptedFiles = [];
    let rejectedCount = 0;

    files.forEach((file) => {
      if (!allowedImageTypes.has(file.type) || file.size > maxImageSize) {
        rejectedCount += 1;
        return;
      }
      acceptedFiles.push({ caption: "", file });
    });

    state.newFiles.push(...acceptedFiles);
    elements.newPhotos.value = "";
    renderNewPhotos();

    if (rejectedCount) {
      setMessage(
        `${rejectedCount}개 파일은 형식 또는 6 MiB 제한 때문에 제외되었습니다.`,
        "warning",
      );
    }
  };

  const handleLogoSelection = (kind, event) => {
    const [file] = event.target.files;
    if (!file) {
      state.logoFiles[kind] = null;
      refreshLogoPreview(kind);
      return;
    }
    if (!allowedImageTypes.has(file.type) || file.size > maxImageSize) {
      event.target.value = "";
      state.logoFiles[kind] = null;
      setMessage(
        "로고 파일은 AVIF, GIF, JPG, PNG, WebP 형식이며 6 MiB 이하여야 합니다.",
        "warning",
      );
      refreshLogoPreview(kind);
      return;
    }
    state.logoFiles[kind] = file;
    state.removeLogos[kind] = false;
    refreshLogoPreview(kind);
  };

  const removeLogo = (kind) => {
    state.logoFiles[kind] = null;
    state.removeLogos[kind] = true;
    logoFields[kind].file.value = "";
    refreshLogoPreview(kind);
  };

  const initialize = async () => {
    if (!client || !bucket || !siteAssetsBucket) {
      setMessage(
        "Supabase 설정을 불러오지 못했습니다. 관리자에게 문의해 주세요.",
        "danger",
      );
      elements.loginButton.disabled = true;
      return;
    }

    try {
      const {
        data: { user },
        error,
      } = await client.auth.getUser();

      if (error || !user) {
        showLogin();
        return;
      }

      await authorizeUser(user);
    } catch (error) {
      console.error("관리자 세션 확인에 실패했습니다.", error);
      showLogin();
      setMessage("관리자 세션을 확인하지 못했습니다.", "danger");
    }
  };

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.activityForm.addEventListener("submit", handleSaveActivity);
  elements.siteContentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sectionName = event.submitter?.dataset.section;
    if (sectionName) {
      handleSaveSiteContentSection(sectionName);
    }
  });
  elements.newPhotos.addEventListener("change", handlePhotoSelection);
  Object.entries(logoFields).forEach(([kind, fields]) => {
    fields.file.addEventListener("change", (event) =>
      handleLogoSelection(kind, event),
    );
    fields.removeButton.addEventListener("click", () => removeLogo(kind));
  });
  elements.activityIcon.addEventListener("change", () =>
    updateIconPreview(elements.activityIcon, elements.activityIconPreview),
  );
  elements.contactOverlayColor.addEventListener("input", () => {
    elements.contactOverlayColorValue.value =
      elements.contactOverlayColor.value.toUpperCase();
  });
  elements.activityViewTab.addEventListener("click", () => {
    clearMessage();
    activateAdminView("activities");
  });
  elements.siteContentViewTab.addEventListener("click", () => {
    clearMessage();
    activateAdminView("content");
  });
  elements.addServiceItemButton.addEventListener("click", () => {
    appendServiceContentItem({
      title: "",
      description: "",
      icon: "bi-stars",
    });
  });
  elements.addContactItemButton.addEventListener("click", () => {
    appendContactContentItem({
      type: "email",
      label: "",
      email: "",
      icon: "bi-envelope",
      social: false,
    });
  });
  elements.newActivityButton.addEventListener("click", () => {
    clearMessage();
    resetActivityForm();
    document.querySelector(".editor-panel").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
  elements.resetActivityButton.addEventListener("click", () => {
    clearMessage();
    if (state.selectedActivityId) {
      selectActivity(state.selectedActivityId);
    } else {
      resetActivityForm();
    }
  });
  elements.resetSiteContentButton.addEventListener("click", () => {
    clearMessage();
    renderSiteContentForm();
  });
  elements.deleteActivityButton.addEventListener("click", handleDeleteActivity);
  elements.logoutButton.addEventListener("click", async () => {
    clearMessage();
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("로그아웃에 실패했습니다.", error);
      setMessage("로그아웃하지 못했습니다.", "danger");
      return;
    }
    showLogin();
    setMessage("로그아웃되었습니다.", "success");
  });

  client?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    }
  });

  window.addEventListener("beforeunload", () => {
    revokePreviewUrls();
    Object.keys(logoFields).forEach(revokeLogoPreview);
  });
  initialize();
})();
