const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const migration = fs.readFileSync(
  path.join(
    projectRoot,
    "supabase/migrations/20260812091740_add_dynamic_activity_types.sql",
  ),
  "utf8",
);

assert.match(migration, /create table public\.activity_types/);
assert.match(migration, /foreign key \(activity_type\)/);
assert.match(migration, /references public\.activity_types \(slug\)/);
assert.match(migration, /alter table public\.activity_types enable row level security/);
assert.match(migration, /create policy activity_types_select_all/);
assert.match(migration, /create policy activity_types_insert_admin/);
assert.match(migration, /where site_admins\.user_id = \(select auth\.uid\(\)\)/);
assert.match(migration, /create unique index activity_types_label_lower_idx/);
assert.doesNotMatch(migration, /grant (?:update|delete)/i);

console.log("Dynamic activity type migration checks passed.");
