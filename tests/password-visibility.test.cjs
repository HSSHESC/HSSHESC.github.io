const assert = require("node:assert/strict");
const { initialize } = require("../assets/js/password-visibility.js");

class ElementStub {
  constructor(tagName) {
    this.attributes = new Map();
    this.children = [];
    this.className = "";
    this.dataset = {};
    this.listeners = new Map();
    this.parentNode = null;
    this.tagName = tagName.toUpperCase();
    this.title = "";
    this.type = "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  append(...children) {
    children.forEach((child) => {
      child.parentNode = this;
      this.children.push(child);
    });
  }

  focus() {
    this.focused = true;
  }

  insertBefore(child) {
    child.parentNode = this;
    this.children.push(child);
  }

  querySelector(selector) {
    return selector === "i"
      ? (this.children.find((child) => child.tagName === "I") ?? null)
      : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

const parent = new ElementStub("div");
const input = new ElementStub("input");
input.id = "testPassword";
input.type = "password";
input.parentNode = parent;
const documentStub = {
  createElement(tagName) {
    return new ElementStub(tagName);
  },
  querySelectorAll() {
    return [input];
  },
};

const [button] = initialize(documentStub);

assert.equal(input.type, "password");
assert.equal(button.title, "비밀번호 표시");
assert.equal(button.attributes.get("aria-controls"), input.id);
assert.equal(button.attributes.get("aria-pressed"), "false");
assert.equal(button.querySelector("i").className, "bi bi-eye");

button.listeners.get("click")();
assert.equal(input.type, "text");
assert.equal(button.title, "비밀번호 숨기기");
assert.equal(button.attributes.get("aria-pressed"), "true");
assert.equal(button.querySelector("i").className, "bi bi-eye-slash");
assert.equal(input.focused, true);

button.listeners.get("click")();
assert.equal(input.type, "password");
assert.equal(button.title, "비밀번호 표시");
assert.equal(button.attributes.get("aria-pressed"), "false");

assert.deepEqual(initialize(documentStub), []);

console.log("Password visibility toggle checks passed.");
