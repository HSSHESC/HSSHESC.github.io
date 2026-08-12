(function () {
  "use strict";

  const faqList = document.querySelector("#faqList");
  const languageSwitch = document.querySelector("#languageSwitch");

  const renderFaq = async () => {
    const rawContent = await window.ESC_SITE_CONTENT_READY;
    const content = window.ESC_I18N.localizeSite(rawContent);
    const faq = content.faq ?? {};
    document.title = `${faq.title ?? "FAQ"} | ESC`;
    document.querySelector("#faqTitle").textContent = faq.title ?? "FAQ";
    document.querySelector("#faqSubtitle").textContent = faq.subtitle ?? "";
    document.querySelector("#faqHomeLink").textContent =
      window.ESC_I18N.getLocale() === "ko" ? "홈으로" : "Home";
    languageSwitch.textContent =
      window.ESC_I18N.getLocale() === "ko" ? "EN" : "한국어";
    languageSwitch.setAttribute(
      "aria-label",
      window.ESC_I18N.getLocale() === "ko" ? "영어로 보기" : "View in Korean",
    );

    const items = Array.isArray(faq.items) ? faq.items : [];
    faqList.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "faq-empty";
      empty.textContent =
        window.ESC_I18N.getLocale() === "ko"
          ? "등록된 질문이 없습니다."
          : "No questions have been added yet.";
      faqList.append(empty);
      return;
    }

    items.forEach((item, index) => {
      const details = document.createElement("details");
      details.className = "faq-item";
      const summary = document.createElement("summary");
      summary.textContent = item.question ?? "";
      summary.setAttribute("aria-controls", `faq-answer-${index}`);
      const answer = document.createElement("div");
      answer.className = "faq-answer markdown-content";
      answer.id = `faq-answer-${index}`;
      if (window.ESC_MARKDOWN) {
        answer.append(window.ESC_MARKDOWN.render(item.answer ?? ""));
      } else {
        answer.textContent = item.answer ?? "";
      }
      details.append(summary, answer);
      faqList.append(details);
    });

    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.id = "faqStructuredData";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question ?? "",
        acceptedAnswer: { "@type": "Answer", text: item.answer ?? "" },
      })),
    });
    document.querySelector("#faqStructuredData")?.remove();
    document.head.append(schema);
  };

  languageSwitch.addEventListener("click", () => {
    window.ESC_I18N.setLocale(
      window.ESC_I18N.getLocale() === "ko" ? "en" : "ko",
    );
  });
  window.addEventListener("esc:languagechange", renderFaq);
  renderFaq();
})();
