const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const storage = new Map();
const events = [];
const location = new URL("https://hsshesc.github.io/?lang=ko");
const context = vm.createContext({
  CustomEvent: class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  },
  URL,
  URLSearchParams,
  document: { documentElement: { lang: "ko" } },
  history: {
    replaceState(_state, _title, url) {
      location.href = url.href;
    },
  },
  localStorage: {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
  },
  location,
});
context.window = context;
context.dispatchEvent = (event) => events.push(event);

vm.runInContext(
  fs.readFileSync(path.resolve(__dirname, "../assets/js/i18n.js"), "utf8"),
  context,
);

assert.equal(context.ESC_I18N.getLocale(), "ko");
context.ESC_I18N.setLocale("en");
assert.equal(context.ESC_I18N.getLocale(), "en");
assert.equal(context.document.documentElement.lang, "en");
assert.equal(storage.get("esc-locale"), "en");
assert.equal(new URL(location.href).searchParams.get("lang"), "en");
assert.equal(events.at(-1).detail.locale, "en");

const localizedSite = context.ESC_I18N.localizeSite({
  about: { title: "소개", body: "한국어" },
  translations: { en: { about: { title: "About" } } },
});
assert.equal(localizedSite.about.title, "About");
assert.equal(localizedSite.about.body, "한국어");

const localizedActivity = context.ESC_I18N.localizeActivity({
  title: "활동",
  title_en: "Activity",
  description: "설명",
  description_en: "Description",
});
assert.equal(localizedActivity.title, "Activity");
assert.equal(localizedActivity.description, "Description");

console.log("Korean and English localization checks passed.");
