const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const migration = fs.readFileSync(
  path.join(
    projectRoot,
    "supabase/migrations/20260813104147_harden_public_api_permissions.sql",
  ),
  "utf8",
);
const config = fs.readFileSync(
  path.join(projectRoot, "assets/js/supabase-config.js"),
  "utf8",
);
const removeMfaMigration = fs.readFileSync(
  path.join(
    projectRoot,
    "supabase/migrations/20260816014000_remove_admin_mfa.sql",
  ),
  "utf8",
);

assert.match(migration, /record_site_visit[\s\S]*security definer/i);
assert.match(migration, /get_site_visitor_stats[\s\S]*security definer/i);
assert.match(
  migration,
  /revoke all on table private\.site_visits from anon, authenticated/i,
);
assert.match(
  migration,
  /revoke all on schema private from anon, authenticated/i,
);
assert.match(migration, /drop policy if exists site_visits_insert_tracking/i);
assert.match(migration, /grant select \(id, content\).*to anon/is);
assert.match(config, /publishableKey:\s*"sb_publishable_/);
assert.match(config, /officialOrigin:\s*"https:\/\/hsshesc\.github\.io"/);
assert.doesNotMatch(removeMfaMigration, /auth\.jwt\(\)[\s\S]*aal2/i);
assert.doesNotMatch(removeMfaMigration, /Multi-factor authentication/i);
assert.match(
  removeMfaMigration,
  /alter policy activities_insert_admin[\s\S]*site_admins[\s\S]*auth\.uid\(\)/i,
);
assert.match(
  removeMfaMigration,
  /get_site_visitor_stats[\s\S]*Administrator access is required/i,
);

const textFilePattern = /(?:^|\/)(?:[^/]+\.(?:c?js|css|html|ini|json|md|sql|toml|txt|ya?ml)|\.env\.example)$/i;
const trackedSources = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: projectRoot },
)
  .toString("utf8")
  .split("\0")
  .filter((name) => name && textFilePattern.test(name));
const source = trackedSources
  .map((name) => fs.readFileSync(path.join(projectRoot, name), "utf8"))
  .join("\n");

assert.doesNotMatch(source, /sb_secret_[A-Za-z0-9_-]{20,}/);
assert.doesNotMatch(
  source,
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
);
assert.doesNotMatch(source, /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/);
assert.doesNotMatch(source, /AKIA[0-9A-Z]{16}/);
assert.doesNotMatch(source, /sbp_[A-Za-z0-9_-]{20,}/);
assert.doesNotMatch(source, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);

console.log("Public API permission and tracked secret checks passed.");
