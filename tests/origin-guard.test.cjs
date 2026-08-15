const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.resolve(__dirname, "../assets/js/origin-guard.js"),
  "utf8",
);

const runGuard = (origin, pathname) => {
  const redirects = [];
  const context = vm.createContext({
    window: {
      location: {
        origin,
        pathname,
        replace(url) {
          redirects.push(url);
        },
      },
    },
  });
  vm.runInContext(source, context, { filename: "assets/js/origin-guard.js" });
  return { redirects, window: context.window };
};

const official = runGuard("https://hsshesc.github.io", "/admin.html");
assert.deepEqual(official.redirects, []);
assert.equal(official.window.ESC_OFFICIAL_ORIGIN, "https://hsshesc.github.io");

const clonedAdmin = runGuard("https://example.com", "/copy/admin.html");
assert.deepEqual(clonedAdmin.redirects, [
  "https://hsshesc.github.io/admin.html",
]);

const clonedUnknown = runGuard("https://example.com", "/copy/unknown.html");
assert.deepEqual(clonedUnknown.redirects, ["https://hsshesc.github.io/"]);

console.log("Official-origin redirect checks passed.");
