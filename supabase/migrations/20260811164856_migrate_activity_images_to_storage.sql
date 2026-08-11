begin;

do $$
declare
    expected_paths text[] := array[
        '10000000-0000-4000-8000-000000000001/legacy/20000000-0000-4000-8000-000000000001.png',
        '10000000-0000-4000-8000-000000000001/legacy/20000000-0000-4000-8000-000000000002.png',
        '10000000-0000-4000-8000-000000000001/legacy/20000000-0000-4000-8000-000000000003.png',
        '10000000-0000-4000-8000-000000000002/legacy/20000000-0000-4000-8000-000000000004.png',
        '10000000-0000-4000-8000-000000000003/legacy/20000000-0000-4000-8000-000000000005.png',
        '10000000-0000-4000-8000-000000000003/legacy/20000000-0000-4000-8000-000000000006.png',
        '10000000-0000-4000-8000-000000000003/legacy/20000000-0000-4000-8000-000000000007.png',
        '10000000-0000-4000-8000-000000000004/legacy/20000000-0000-4000-8000-000000000008.jpg',
        '10000000-0000-4000-8000-000000000004/legacy/20000000-0000-4000-8000-000000000009.png',
        '10000000-0000-4000-8000-000000000004/legacy/20000000-0000-4000-8000-000000000010.png',
        '10000000-0000-4000-8000-000000000005/legacy/20000000-0000-4000-8000-000000000011.png',
        '10000000-0000-4000-8000-000000000006/legacy/20000000-0000-4000-8000-000000000012.png'
    ];
    stored_count integer;
    updated_count integer;
begin
    select count(*)
    into stored_count
    from storage.objects
    where bucket_id = 'activity-images'
      and name = any (expected_paths);

    if stored_count <> cardinality(expected_paths) then
        raise exception
            'Expected % migrated activity images but found %',
            cardinality(expected_paths),
            stored_count;
    end if;

    update public.activity_photos
    set
        storage_path = case id
            when '20000000-0000-4000-8000-000000000001'::uuid then expected_paths[1]
            when '20000000-0000-4000-8000-000000000002'::uuid then expected_paths[2]
            when '20000000-0000-4000-8000-000000000003'::uuid then expected_paths[3]
            when '20000000-0000-4000-8000-000000000004'::uuid then expected_paths[4]
            when '20000000-0000-4000-8000-000000000005'::uuid then expected_paths[5]
            when '20000000-0000-4000-8000-000000000006'::uuid then expected_paths[6]
            when '20000000-0000-4000-8000-000000000007'::uuid then expected_paths[7]
            when '20000000-0000-4000-8000-000000000008'::uuid then expected_paths[8]
            when '20000000-0000-4000-8000-000000000009'::uuid then expected_paths[9]
            when '20000000-0000-4000-8000-000000000010'::uuid then expected_paths[10]
            when '20000000-0000-4000-8000-000000000011'::uuid then expected_paths[11]
            when '20000000-0000-4000-8000-000000000012'::uuid then expected_paths[12]
        end,
        image_url = null
    where id = any (array[
        '20000000-0000-4000-8000-000000000001'::uuid,
        '20000000-0000-4000-8000-000000000002'::uuid,
        '20000000-0000-4000-8000-000000000003'::uuid,
        '20000000-0000-4000-8000-000000000004'::uuid,
        '20000000-0000-4000-8000-000000000005'::uuid,
        '20000000-0000-4000-8000-000000000006'::uuid,
        '20000000-0000-4000-8000-000000000007'::uuid,
        '20000000-0000-4000-8000-000000000008'::uuid,
        '20000000-0000-4000-8000-000000000009'::uuid,
        '20000000-0000-4000-8000-000000000010'::uuid,
        '20000000-0000-4000-8000-000000000011'::uuid,
        '20000000-0000-4000-8000-000000000012'::uuid
    ]);

    get diagnostics updated_count = row_count;
    if updated_count <> cardinality(expected_paths) then
        raise exception
            'Expected to update % activity photo rows but updated %',
            cardinality(expected_paths),
            updated_count;
    end if;
end;
$$;

commit;
