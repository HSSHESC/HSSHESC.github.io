begin;

create policy site_visits_insert_tracking
on private.site_visits
for insert
to anon, authenticated
with check (true);

create policy site_visits_select_admin
on private.site_visits
for select
to authenticated
using (
    exists (
        select 1
        from public.site_admins
        where site_admins.user_id = (select auth.uid())
    )
);

grant usage on schema private to anon, authenticated;
grant insert on table private.site_visits to anon, authenticated;
grant select on table private.site_visits to authenticated;

alter function public.record_site_visit(uuid) security invoker;
alter function public.get_site_visitor_stats(date, date, text) security invoker;

commit;
