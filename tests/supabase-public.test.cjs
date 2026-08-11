const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const storage = new Map();
class WebSocketStub {}

const context = vm.createContext({
  AbortController,
  Blob,
  Headers,
  Request,
  Response,
  TextDecoder,
  TextEncoder,
  URL,
  URLSearchParams,
  WebSocket: WebSocketStub,
  atob,
  btoa,
  clearInterval,
  clearTimeout,
  console,
  crypto: crypto.webcrypto,
  fetch,
  localStorage: {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    removeItem(key) {
      storage.delete(key);
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
  },
  location: { href: "http://localhost/" },
  navigator: { onLine: true },
  setInterval,
  setTimeout,
});

context.window = context;
context.globalThis = context;

const runBrowserScript = (relativePath) => {
  const filename = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  vm.runInContext(source, context, { filename });
};

runBrowserScript("assets/vendor/supabase/supabase.js");
runBrowserScript("assets/js/supabase-config.js");
runBrowserScript("assets/js/supabase-client.js");
runBrowserScript("assets/js/activities.js");

(async () => {
  const activities = await context.ESC_ACTIVITIES.loadPublished();
  const { data: siteContent, error: siteContentError } =
    await context.ESC_SUPABASE.from("site_content")
      .select("id,content")
      .eq("id", "home")
      .single();

  assert.ifError(siteContentError);
  assert.equal(siteContent.id, "home");
  assert.equal(siteContent.content.about.title, "동아리 소개");
  assert.equal(siteContent.content.activity_plans.items.length, 6);
  assert.equal(siteContent.content.contact.items.length, 3);

  assert.equal(activities.length, 6);
  assert.equal(activities[0].title, "2026 수학과학체험전");
  assert.equal(activities[0].images.length, 3);
  assert.equal(
    activities[0].imageCaptions[0],
    "2026 수학과학체험전 활동 사진 1",
  );
  assert.ok(
    activities.every((activity) =>
      activity.images.every((image) =>
        image.startsWith(
          "https://cpjiqlrjxchjipceiyus.supabase.co/storage/v1/object/sign/activity-images/",
        ),
      ),
    ),
  );
  assert.ok(
    activities.every((activity) =>
      activity.images.every((image) => image.includes("token=")),
    ),
  );

  const firstImageResponse = await fetch(activities[0].images[0]);
  assert.equal(firstImageResponse.ok, true);
  assert.equal(
    Number(firstImageResponse.headers.get("content-length")),
    232826,
  );

  const unsignedPublicImageUrl = `${activities[0].images[0]
    .replace("/storage/v1/object/sign/", "/storage/v1/object/public/")
    .replace(/\?token=.*/, "")}?private-check=${Date.now()}`;
  const unsignedPublicImageResponse = await fetch(unsignedPublicImageUrl, {
    cache: "no-store",
  });
  assert.equal(unsignedPublicImageResponse.ok, false);

  console.log("Supabase public content and activity queries passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
