const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.resolve(__dirname, "../assets/js/visitor-analytics.js"),
  "utf8",
);
const localValues = new Map();
const sessionValues = new Map();
const calls = [];
const createStorage = (values) => ({
  getItem(key) {
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
});
const context = vm.createContext({
  Date,
  Uint8Array,
  console,
  crypto: crypto.webcrypto,
});

context.window = context;
context.localStorage = createStorage(localValues);
context.sessionStorage = createStorage(sessionValues);
context.ESC_SUPABASE = {
  async rpc(name, parameters) {
    calls.push({ name, parameters });
    return { error: null };
  },
};

const waitForAsyncWork = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
  vm.runInContext(source, context, { filename: "visitor-analytics.js" });
  await waitForAsyncWork();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "record_site_visit");
  assert.match(
    calls[0].parameters.p_visitor_token,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.equal(localValues.get("esc-visitor-token-v1"), calls[0].parameters.p_visitor_token);
  assert.match(
    localValues.get("esc-visitor-recorded-date-v1"),
    /^\d{4}-\d{2}-\d{2}$/,
  );

  vm.runInContext(source, context, { filename: "visitor-analytics.js" });
  await waitForAsyncWork();
  assert.equal(calls.length, 1);

  assert.ok(!source.includes("userAgent"));
  assert.ok(!source.includes("x-forwarded-for"));
  assert.ok(!source.includes("request.headers"));

  console.log("Privacy-minimized visitor analytics checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
