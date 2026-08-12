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
  const { data: photoRows, error: photoRowsError } =
    await context.ESC_SUPABASE.from("activity_photos")
      .select("storage_path")
      .order("storage_path");

  assert.ifError(siteContentError);
  assert.ifError(photoRowsError);
  assert.equal(siteContent.id, "home");
  assert.equal(typeof siteContent.content.about.title, "string");
  assert.equal(typeof siteContent.content.about.body_markdown, "string");
  assert.equal(typeof siteContent.content.about.plans_markdown, "string");
  assert.equal(siteContent.content.about.paragraphs, undefined);
  assert.equal(siteContent.content.about.plans, undefined);
  assert.ok(Array.isArray(siteContent.content.activity_plans.items));
  assert.ok(Array.isArray(siteContent.content.contact.items));
  assert.ok(
    siteContent.content.contact.items.every((item) =>
      ["email", "github"].includes(item.type),
    ),
  );
  assert.ok(
    siteContent.content.contact.items
      .filter((item) => item.type === "email")
      .every((item) => item.email && item.href === undefined),
  );
  assert.ok(
    siteContent.content.contact.items
      .filter((item) => item.type === "github")
      .every((item) => /^https:\/\/github\.com\//.test(item.url)),
  );
  assert.match(
    siteContent.content.appearance.contact_overlay_color,
    /^#[0-9a-f]{6}$/i,
  );
  assert.ok(
    siteContent.content.branding.club_logo_storage_path === null ||
      typeof siteContent.content.branding.club_logo_storage_path === "string",
  );
  assert.ok(
    siteContent.content.branding.school_logo_storage_path === null ||
      typeof siteContent.content.branding.school_logo_storage_path === "string",
  );

  assert.ok(photoRows.length > 0);
  assert.ok(
    photoRows.every((photo) =>
      /^[0-9a-f-]{36}\/(legacy|[0-9a-f-]+)\//i.test(photo.storage_path),
    ),
  );

  assert.ok(activities.length > 0);
  assert.ok(activities.every((activity) => activity.title));
  assert.equal(
    photoRows.length,
    activities.reduce((count, activity) => count + activity.images.length, 0),
  );
  assert.ok(activities[0].images.length > 0);
  assert.equal(typeof activities[0].imageCaptions[0], "string");
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
  assert.ok(Number(firstImageResponse.headers.get("content-length")) > 0);

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
