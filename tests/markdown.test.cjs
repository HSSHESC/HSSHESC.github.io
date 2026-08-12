const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

class TestNode {
  constructor() {
    this.childNodes = [];
  }

  append(...nodes) {
    nodes.forEach((node) => this.childNodes.push(node));
  }

  serializeChildren() {
    return this.childNodes.map((node) => node.serialize()).join("");
  }
}

class TestText extends TestNode {
  constructor(value) {
    super();
    this.value = value;
  }

  serialize() {
    return escapeHtml(this.value);
  }
}

class TestFragment extends TestNode {
  serialize() {
    return this.serializeChildren();
  }
}

class TestElement extends TestNode {
  constructor(tagName) {
    super();
    this.tagName = tagName.toLowerCase();
    this.attributes = new Map();
  }

  set href(value) {
    this.attributes.set("href", value);
  }

  set rel(value) {
    this.attributes.set("rel", value);
  }

  set textContent(value) {
    this.childNodes = [new TestText(value)];
  }

  get innerHTML() {
    return this.serializeChildren();
  }

  serialize() {
    const attributes = [...this.attributes]
      .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
      .join("");
    if (["br", "hr"].includes(this.tagName)) {
      return `<${this.tagName}${attributes}>`;
    }
    return `<${this.tagName}${attributes}>${this.serializeChildren()}</${this.tagName}>`;
  }
}

const document = {
  createDocumentFragment: () => new TestFragment(),
  createElement: (tagName) => new TestElement(tagName),
  createTextNode: (value) => new TestText(value),
};

const context = vm.createContext({
  URL,
  document,
  location: { href: "https://hsshesc.github.io/" },
});
context.window = context;
context.globalThis = context;

const source = fs.readFileSync(
  path.resolve(__dirname, "../assets/js/markdown.js"),
  "utf8",
);
vm.runInContext(source, context, { filename: "assets/js/markdown.js" });

const html = context.ESC_MARKDOWN.toHtml(`# 제목

**굵게**와 *기울임*, [안전한 링크](https://example.com/path)

[위험한 링크](javascript:alert(1)) <script>alert("x")</script>

- 첫 항목
- 둘째 항목

> 인용문

\`\`\`
<img src=x onerror=alert(1)>
\`\`\``);

assert.match(html, /<h1>제목<\/h1>/);
assert.match(html, /<strong>굵게<\/strong>/);
assert.match(html, /<em>기울임<\/em>/);
assert.match(
  html,
  /<a href="https:\/\/example\.com\/path" rel="noopener noreferrer">안전한 링크<\/a>/,
);
assert.match(html, /<ul><li>첫 항목<\/li><li>둘째 항목<\/li><\/ul>/);
assert.match(html, /<blockquote><p>인용문<\/p><\/blockquote>/);
assert.ok(!html.includes("<script>"));
assert.ok(!html.includes('href="javascript:'));
assert.ok(!html.includes("<img"));
assert.match(html, /&lt;script&gt;/);
assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);

console.log("Markdown rendering and sanitization checks passed.");
