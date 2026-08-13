begin;

create or replace function public.record_site_visit(p_visitor_token uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    visitor_date date := (now() at time zone 'Asia/Seoul')::date;
    visitor_month date;
begin
    if p_visitor_token is null then
        raise exception 'A visitor token is required.'
            using errcode = '22023';
    end if;

    visitor_month := date_trunc('month', visitor_date::timestamp)::date;

    begin
        insert into private.site_visits (
            visit_date,
            daily_visitor_hash,
            month_start,
            monthly_visitor_hash
        ) values (
            visitor_date,
            extensions.digest(
                p_visitor_token::text || ':day:' || visitor_date::text,
                'sha256'
            ),
            visitor_month,
            extensions.digest(
                p_visitor_token::text || ':month:' || visitor_month::text,
                'sha256'
            )
        );
    exception
        when unique_violation then
            null;
    end;
end;
$$;

revoke all on function public.record_site_visit(uuid)
    from public, anon, authenticated;
grant execute on function public.record_site_visit(uuid)
    to anon, authenticated;

commit;
