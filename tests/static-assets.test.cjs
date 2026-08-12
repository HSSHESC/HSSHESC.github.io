const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const htmlFiles = ["index.html", "admin.html", "faq.html"];
const missing = [];

htmlFiles.forEach((relativePath) => {
  const source = read(relativePath);
  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|#|data:)/i.test(reference)) {
      continue;
    }
    const target = reference.split(/[?#]/, 1)[0];
    if (!fs.existsSync(path.resolve(projectRoot, target))) {
      missing.push(`${relativePath}: ${reference}`);
    }
  }
});

["assets/css/style.css", "assets/css/admin.css"].forEach((relativePath) => {
  const source = read(relativePath);
  for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const reference = match[1];
    if (/^(?:https?:|data:)/i.test(reference)) {
      continue;
    }
    const target = path.resolve(
      projectRoot,
      path.dirname(relativePath),
      reference,
    );
    if (!fs.existsSync(target)) {
      missing.push(`${relativePath}: ${reference}`);
    }
  }
});

assert.deepEqual(missing, []);

const indexHtml = read("index.html");
const markdownPosition = indexHtml.indexOf("assets/js/markdown.js");
const yearPosition = indexHtml.indexOf("assets/js/year.js");
assert.ok(markdownPosition >= 0);
assert.ok(yearPosition >= 0);
assert.ok(yearPosition < indexHtml.indexOf("assets/js/site-content.js"));
assert.ok(markdownPosition < indexHtml.indexOf("assets/js/site-content.js"));
assert.ok(markdownPosition < indexHtml.indexOf("assets/js/main.js"));
assert.ok(indexHtml.includes('id="activitySearch"'));
assert.ok(indexHtml.includes('href="faq.html"'));
assert.ok(
  indexHtml.indexOf('id="navContact"') < indexHtml.indexOf('id="navFaq"'),
);
assert.ok(!indexHtml.includes('id="languageSwitch"'));
assert.ok(!indexHtml.includes("assets/js/i18n.js"));
assert.ok(!indexHtml.includes('hreflang="en"'));
assert.match(indexHtml, /id="navHome"[^>]*>\s*Home<\/a\s*>/);
assert.match(indexHtml, /id="navAbout"[^>]*>\s*About<\/a\s*>/);
assert.match(indexHtml, /id="navActivities"[^>]*>\s*Activities<\/a\s*>/);
assert.match(indexHtml, /id="navPortfolio"[^>]*>\s*Portfolio<\/a\s*>/);
assert.match(indexHtml, /id="navContact"[^>]*>\s*Contact<\/a\s*>/);
assert.ok(indexHtml.includes("ESC, pioneers of empty spaces"));
assert.ok(indexHtml.includes("Developer, Maker, Leader"));
assert.ok(indexHtml.includes("All Rights Reserved."));
assert.ok(!indexHtml.includes("bootstrap.bundle.min.js"));
assert.ok(!indexHtml.includes('id="siteHeaderLogo"'));
assert.ok(!/(?:19|20)\d{2}학년도/.test(indexHtml));

const adminHtml = read("admin.html");
assert.ok(adminHtml.indexOf("assets/js/year.js") >= 0);
assert.ok(
  adminHtml.indexOf("assets/js/year.js") <
    adminHtml.indexOf("assets/js/admin.js"),
);
assert.ok(adminHtml.includes('id="toolsAdminView"'));
assert.ok(adminHtml.includes('id="faqAdminItems"'));
assert.ok(adminHtml.includes('id="revisionList"'));
assert.ok(adminHtml.includes('id="adminStats"'));

const faqHtml = read("faq.html");
assert.ok(faqHtml.includes('id="faqList"'));
assert.ok(faqHtml.includes("assets/js/faq.js"));
assert.ok(faqHtml.includes('rel="canonical"'));
assert.ok(!faqHtml.includes('id="languageSwitch"'));
assert.ok(!faqHtml.includes("assets/js/i18n.js"));
assert.ok(!faqHtml.includes('hreflang="en"'));
assert.ok(faqHtml.includes('id="faqHomeLink">Home</a>'));
assert.ok(faqHtml.includes("All Rights Reserved."));
assert.ok(!adminHtml.includes("activityTitleEn"));
assert.ok(!adminHtml.includes("activityDescriptionEn"));
assert.ok(!adminHtml.includes("contentLocale"));
assert.ok(!adminHtml.includes("faqTitleEn"));

const languageCleanupMigration = read(
  "supabase/migrations/20260812054057_restore_original_labels_remove_english_data.sql",
);
assert.ok(languageCleanupMigration.includes("content - 'translations'"));
assert.ok(languageCleanupMigration.includes("drop column if exists title_en"));
assert.ok(
  languageCleanupMigration.includes("drop column if exists description_en"),
);

const currentSiteSources = [
  indexHtml,
  read("admin.html"),
  read("assets/css/style.css"),
  read("assets/css/admin.css"),
  ...fs
    .readdirSync(path.join(projectRoot, "assets/js"))
    .map((name) => read(`assets/js/${name}`)),
].join("\n");

assert.ok(!/assets\/img\/20\d{2}-\d{2}-\d{2}\//.test(currentSiteSources));
assert.ok(!currentSiteSources.includes("esc-banner-logo.png"));
assert.ok(!currentSiteSources.includes("esc-logo-icon.png"));

console.log("Static asset references and script ordering checks passed.");
