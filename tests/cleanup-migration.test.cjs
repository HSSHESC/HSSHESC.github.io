const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migration = fs.readFileSync(
  path.resolve(
    __dirname,
    "../supabase/migrations/20260813024449_cleanup_unused_schema_and_retain_revisions.sql",
  ),
  "utf8",
);

assert.match(migration, /drop column if exists month_start/i);
assert.match(migration, /drop column if exists monthly_visitor_hash/i);
assert.match(migration, /drop column if exists first_visited_at/i);
assert.match(migration, /drop index if exists public\.activities_tags_idx/i);
assert.match(
  migration,
  /drop index if exists public\.content_revisions_entity_created_idx/i,
);
assert.doesNotMatch(
  migration,
  /drop index if exists public\.content_revisions_created_at_idx/i,
);
assert.match(
  migration,
  /where created_at < now\(\) - interval '3 days'/i,
);
assert.match(
  migration,
  /delete-content-revisions-older-than-three-days/i,
);
assert.match(migration, /'17 \* \* \* \*'/);
assert.match(
  migration,
  /insert into private\.site_visits \(\s*visit_date,\s*daily_visitor_hash\s*\)/i,
);

console.log("Unused schema cleanup and revision retention checks passed.");
