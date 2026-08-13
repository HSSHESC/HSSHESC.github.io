const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migration = fs.readFileSync(
  path.resolve(
    __dirname,
    "../supabase/migrations/20260813015100_add_private_visitor_analytics.sql",
  ),
  "utf8",
);
const hardeningMigration = fs.readFileSync(
  path.resolve(
    __dirname,
    "../supabase/migrations/20260813015416_harden_visitor_analytics_permissions.sql",
  ),
  "utf8",
);
const duplicateHandlingMigration = fs.readFileSync(
  path.resolve(
    __dirname,
    "../supabase/migrations/20260813015738_handle_duplicate_site_visits.sql",
  ),
  "utf8",
);
const monthlyDailySumMigration = fs.readFileSync(
  path.resolve(
    __dirname,
    "../supabase/migrations/20260813022226_sum_daily_visitors_for_monthly_stats.sql",
  ),
  "utf8",
);

assert.match(migration, /create table private\.site_visits/);
assert.match(migration, /alter table private\.site_visits enable row level security/);
assert.match(migration, /security definer\s+set search_path = ''/);
assert.match(migration, /record_site_visit\(p_visitor_token uuid\)/);
assert.match(migration, /get_site_visitor_stats/);
assert.match(migration, /from public\.site_admins/);
assert.match(migration, /site_admins\.user_id = \(select auth\.uid\(\)\)/);
assert.match(migration, /extensions\.digest/);
assert.match(migration, /grant execute on function public\.record_site_visit\(uuid\)\s+to anon, authenticated/);
assert.match(migration, /grant execute on function public\.get_site_visitor_stats\(date, date, text\)\s+to authenticated/);
assert.match(migration, /delete-site-visits-older-than-one-year/);
assert.match(migration, /visit_date <[\s\S]*interval '1 year'/);
assert.doesNotMatch(migration, /\b(?:ip_address|user_agent|referrer)\b/i);
assert.match(hardeningMigration, /create policy site_visits_insert_tracking/);
assert.match(hardeningMigration, /create policy site_visits_select_admin/);
assert.match(hardeningMigration, /grant insert on table private\.site_visits to anon, authenticated/);
assert.match(hardeningMigration, /grant select on table private\.site_visits to authenticated/);
assert.match(hardeningMigration, /alter function public\.record_site_visit\(uuid\) security invoker/);
assert.match(hardeningMigration, /alter function public\.get_site_visitor_stats\(date, date, text\) security invoker/);
assert.doesNotMatch(hardeningMigration, /grant (?:update|delete)/i);
assert.match(duplicateHandlingMigration, /security invoker/);
assert.match(duplicateHandlingMigration, /when unique_violation then/);
assert.doesNotMatch(duplicateHandlingMigration, /on conflict/i);
assert.doesNotMatch(duplicateHandlingMigration, /grant select/i);
assert.match(monthlyDailySumMigration, /with daily_counts as/);
assert.match(monthlyDailySumMigration, /count\(\*\)::bigint as daily_visitor_count/);
assert.match(monthlyDailySumMigration, /coalesce\(sum\(daily_counts\.daily_visitor_count\), 0\)::bigint/);
assert.match(monthlyDailySumMigration, /security invoker/);
assert.doesNotMatch(monthlyDailySumMigration, /count\(\s*distinct/i);
assert.doesNotMatch(monthlyDailySumMigration, /drop (?:column|table|index)/i);

console.log("Visitor analytics schema and security checks passed.");
