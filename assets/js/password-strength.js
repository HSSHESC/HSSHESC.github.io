(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ESC_PASSWORD_STRENGTH = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const emptyResult = Object.freeze({
    key: "empty",
    label: "입력 전",
    percent: 0,
  });

  const levels = Object.freeze({
    weak: Object.freeze({ key: "weak", label: "Weak", percent: 33 }),
    medium: Object.freeze({ key: "medium", label: "Medium", percent: 67 }),
    strong: Object.freeze({ key: "strong", label: "Strong", percent: 100 }),
  });

  const evaluate = (password) => {
    const value = String(password ?? "");
    if (!value) {
      return emptyResult;
    }

    let score = 0;
    score += value.length >= 6 ? 1 : 0;
    score += value.length >= 10 ? 1 : 0;
    score += value.length >= 14 ? 1 : 0;

    const characterGroups = [
      /[a-z]/.test(value),
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length;
    score += Math.max(0, characterGroups - 1);

    if (score <= 2) {
      return levels.weak;
    }
    if (score <= 4) {
      return levels.medium;
    }
    return levels.strong;
  };

  return Object.freeze({ evaluate });
});
