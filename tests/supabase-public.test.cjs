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
  const { data: publicRevisions, error: publicRevisionsError } =
    await context.ESC_SUPABASE.from("content_revisions").select("id");
  const { data: activityTypes, error: activityTypesError } =
    await context.ESC_SUPABASE.from("activity_types")
      .select("slug,label,display_order")
      .order("display_order")
      .order("label");

  assert.ifError(siteContentError);
  assert.ifError(photoRowsError);
  assert.ifError(activityTypesError);
  assert.ok(publicRevisionsError || publicRevisions.length === 0);
  assert.equal(siteContent.id, "home");
  assert.equal(typeof siteContent.content.about.title, "string");
  assert.equal(typeof siteContent.content.about.body_markdown, "string");
  assert.equal(typeof siteContent.content.about.plans_markdown, "string");
  assert.equal(siteContent.content.about.paragraphs, undefined);
  assert.equal(siteContent.content.about.plans, undefined);
  assert.ok(Array.isArray(siteContent.content.activity_plans.items));
  assert.ok(Array.isArray(siteContent.content.faq.items));
  assert.equal(
    siteContent.content.meta.description,
    "ESC, pioneers of empty spaces",
  );
  assert.equal(siteContent.content.meta.keywords, "introducing ESC");
  assert.equal(siteContent.content.navigation.home, "Home");
  assert.equal(siteContent.content.navigation.contact, "Contact");
  assert.deepEqual(Array.from(siteContent.content.hero.typed_items), [
    "Developer",
    "Maker",
    "Leader",
    "Programmer",
    "Scientist",
    "Innovator",
  ]);
  assert.equal(siteContent.content.footer.rights_text, "All Rights Reserved.");
  assert.equal(siteContent.content.translations, undefined);
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
  assert.equal(
    siteContent.content.branding.club_logo_storage_path,
    "branding/club-logo.png",
  );
  assert.equal(
    siteContent.content.branding.school_logo_storage_path,
    "branding/school-logo.jpg",
  );

  assert.ok(photoRows.length > 0);
  assert.ok(
    photoRows.every((photo) =>
      /^[0-9a-f-]{36}\/(?:legacy\/)?[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif)$/i.test(
        photo.storage_path,
      ),
    ),
  );

  assert.ok(activities.length > 0);
  assert.ok(activities.every((activity) => activity.title));
  const activityTypeLabels = new Map(
    activityTypes.map((activityType) => [
      activityType.slug,
      activityType.label,
    ]),
  );
  assert.deepEqual(
    Array.from(activityTypeLabels.entries()).slice(0, 6),
    [
      ["project", "프로젝트"],
      ["education", "교육"],
      ["festival", "축제"],
      ["exchange", "교류"],
      ["competition", "대회"],
      ["other", "기타"],
    ],
  );
  assert.ok(
    activities.every(
      (activity) =>
        activityTypeLabels.has(activity.activityType) &&
        activity.activityTypeLabel ===
          activityTypeLabels.get(activity.activityType),
    ),
  );
  assert.ok(activities.every((activity) => Array.isArray(activity.tags)));
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
