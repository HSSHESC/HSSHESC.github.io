(function () {
  "use strict";

  const safeLink = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:", "mailto:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  };

  const appendInline = (parent, source) => {
    const text = String(source ?? "");
    const tokenPattern =
      /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|_[^_\n]+_|\[[^\]\n]+\]\([^\s)]+\)| {2}\n|\n)/g;
    let cursor = 0;

    for (const match of text.matchAll(tokenPattern)) {
      if (match.index > cursor) {
        parent.append(document.createTextNode(text.slice(cursor, match.index)));
      }

      const token = match[0];
      if (token === "\n" || token === "  \n") {
        parent.append(document.createElement("br"));
      } else if (token.startsWith("`")) {
        const code = document.createElement("code");
        code.textContent = token.slice(1, -1);
        parent.append(code);
      } else if (token.startsWith("**") || token.startsWith("__")) {
        const strong = document.createElement("strong");
        appendInline(strong, token.slice(2, -2));
        parent.append(strong);
      } else if (token.startsWith("~~")) {
        const deleted = document.createElement("del");
        appendInline(deleted, token.slice(2, -2));
        parent.append(deleted);
      } else if (token.startsWith("*") || token.startsWith("_")) {
        const emphasis = document.createElement("em");
        appendInline(emphasis, token.slice(1, -1));
        parent.append(emphasis);
      } else if (token.startsWith("[")) {
        const parts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        const href = parts ? safeLink(parts[2]) : "";
        if (!parts || !href) {
          parent.append(document.createTextNode(token));
        } else {
          const link = document.createElement("a");
          link.href = href;
          appendInline(link, parts[1]);
          if (["http:", "https:"].includes(new URL(href).protocol)) {
            link.rel = "noopener noreferrer";
          }
          parent.append(link);
        }
      }

      cursor = match.index + token.length;
    }

    if (cursor < text.length) {
      parent.append(document.createTextNode(text.slice(cursor)));
    }
  };

  const startsBlock = (line) =>
    /^\s*$/.test(line) ||
    /^#{1,6}\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*([-+*]|\d+\.)\s+/.test(line) ||
    /^\s*```/.test(line) ||
    /^\s*(---+|___+|\*\*\*+)\s*$/.test(line);

  const render = (source) => {
    const fragment = document.createDocumentFragment();
    const lines = String(source ?? "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const fence = /^\s*```/.exec(line);
      if (fence) {
        const codeLines = [];
        index += 1;
        while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
          codeLines.push(lines[index]);
          index += 1;
        }
        index += index < lines.length ? 1 : 0;
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = codeLines.join("\n");
        pre.append(code);
        fragment.append(pre);
        continue;
      }

      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      if (heading) {
        const element = document.createElement(`h${heading[1].length}`);
        appendInline(element, heading[2]);
        fragment.append(element);
        index += 1;
        continue;
      }

      if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) {
        fragment.append(document.createElement("hr"));
        index += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoteLines = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quoteLines.push(lines[index].replace(/^>\s?/, ""));
          index += 1;
        }
        const quote = document.createElement("blockquote");
        quote.append(render(quoteLines.join("\n")));
        fragment.append(quote);
        continue;
      }

      const listMatch = /^\s*([-+*]|\d+\.)\s+(.+)$/.exec(line);
      if (listMatch) {
        const ordered = /\d+\./.test(listMatch[1]);
        const list = document.createElement(ordered ? "ol" : "ul");
        while (index < lines.length) {
          const itemMatch = /^\s*([-+*]|\d+\.)\s+(.+)$/.exec(lines[index]);
          if (!itemMatch || /\d+\./.test(itemMatch[1]) !== ordered) {
            break;
          }
          const item = document.createElement("li");
          appendInline(item, itemMatch[2]);
          list.append(item);
          index += 1;
        }
        fragment.append(list);
        continue;
      }

      const paragraphLines = [line];
      index += 1;
      while (index < lines.length && !startsBlock(lines[index])) {
        paragraphLines.push(lines[index]);
        index += 1;
      }
      const paragraph = document.createElement("p");
      appendInline(paragraph, paragraphLines.join("\n"));
      fragment.append(paragraph);
    }

    return fragment;
  };

  const toHtml = (source) => {
    const container = document.createElement("div");
    container.append(render(source));
    return container.innerHTML;
  };

  window.ESC_MARKDOWN = Object.freeze({ render, safeLink, toHtml });
})();
