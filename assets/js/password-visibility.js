(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ESC_PASSWORD_VISIBILITY = api;
    api.initialize(root.document);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const updateButton = (button, input, visible) => {
    const label = visible ? "비밀번호 숨기기" : "비밀번호 표시";
    const icon = button.querySelector("i");

    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(visible));
    button.title = label;
    if (icon) {
      icon.className = `bi ${visible ? "bi-eye-slash" : "bi-eye"}`;
    }
    input.type = visible ? "text" : "password";
  };

  const enhance = (document, input) => {
    if (!input?.id || input.dataset.passwordVisibility === "ready") {
      return null;
    }

    const wrapper = document.createElement("div");
    const button = document.createElement("button");
    const icon = document.createElement("i");

    wrapper.className = "password-input";
    button.className = "password-visibility-toggle";
    button.type = "button";
    button.setAttribute("aria-controls", input.id);
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);

    input.parentNode.insertBefore(wrapper, input);
    wrapper.append(input, button);
    input.dataset.passwordVisibility = "ready";
    updateButton(button, input, false);

    button.addEventListener("click", () => {
      updateButton(button, input, input.type === "password");
      input.focus();
    });

    return button;
  };

  const initialize = (document) => {
    if (!document?.querySelectorAll) {
      return [];
    }

    return [...document.querySelectorAll('.admin-page input[type="password"]')]
      .map((input) => enhance(document, input))
      .filter(Boolean);
  };

  return Object.freeze({ initialize });
});
