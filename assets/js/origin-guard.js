(function () {
  "use strict";

  const officialOrigin = "https://hsshesc.github.io";
  const officialPages = new Set([
    "account.html",
    "admin.html",
    "faq.html",
    "index.html",
  ]);

  Object.defineProperty(window, "ESC_OFFICIAL_ORIGIN", {
    configurable: false,
    enumerable: true,
    value: officialOrigin,
    writable: false,
  });

  if (window.location.origin === officialOrigin) {
    return;
  }

  const page = window.location.pathname.split("/").filter(Boolean).pop();
  const destination = officialPages.has(page)
    ? `${officialOrigin}/${page}`
    : `${officialOrigin}/`;
  window.location.replace(destination);
})();
