(function () {
  "use strict";

  const signedUrlLifetimeSeconds = 10 * 60;

  const createSignedImageUrls = async (photos) => {
    const client = window.ESC_SUPABASE;
    const bucket = window.ESC_SUPABASE_CONFIG?.activityBucket;
    const paths = [
      ...new Set(photos.map((photo) => photo.storage_path).filter(Boolean)),
    ];

    if (!client || !bucket) {
      throw new Error("Supabase Storage is unavailable.");
    }

    if (!paths.length) {
      return new Map();
    }

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrls(paths, signedUrlLifetimeSeconds);

    if (error) {
      throw error;
    }

    const urls = new Map();
    data.forEach((result, index) => {
      if (result.error || !result.signedUrl) {
        throw result.error ?? new Error("A signed image URL is missing.");
      }
      urls.set(result.path ?? paths[index], result.signedUrl);
    });
    return urls;
  };

  const normalizePhoto = (photo, signedImageUrls) => ({
    id: photo.id,
    caption: photo.caption ?? "",
    displayOrder: photo.display_order ?? 0,
    url: signedImageUrls.get(photo.storage_path) ?? "",
  });

  const loadPublished = async () => {
    const client = window.ESC_SUPABASE;

    if (!client) {
      throw new Error("Supabase client is unavailable.");
    }

    const { data: activities, error: activitiesError } = await client
      .from("activities")
      .select(
        "id,title,description,activity_date,external_url,icon,is_published,activity_type,tags",
      )
      .eq("is_published", true)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (activitiesError) {
      throw activitiesError;
    }

    if (!activities.length) {
      return [];
    }

    const activityIds = activities.map((activity) => activity.id);
    const { data: photos, error: photosError } = await client
      .from("activity_photos")
      .select("id,activity_id,storage_path,caption,display_order,created_at")
      .in("activity_id", activityIds)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (photosError) {
      throw photosError;
    }

    const signedImageUrls = await createSignedImageUrls(photos);

    const photosByActivity = new Map();
    photos.forEach((photo) => {
      const activityPhotos = photosByActivity.get(photo.activity_id) ?? [];
      activityPhotos.push(normalizePhoto(photo, signedImageUrls));
      photosByActivity.set(photo.activity_id, activityPhotos);
    });

    return activities.map((activity) => {
      const activityPhotos = photosByActivity.get(activity.id) ?? [];

      return {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        date: activity.activity_date,
        href: activity.external_url,
        icon: activity.icon,
        activityType: activity.activity_type ?? "other",
        tags: Array.isArray(activity.tags) ? activity.tags : [],
        images: activityPhotos.map((photo) => photo.url),
        imageCaptions: activityPhotos.map(
          (photo) => photo.caption || activity.title,
        ),
      };
    });
  };

  window.ESC_ACTIVITIES = Object.freeze({
    createSignedImageUrls,
    loadPublished,
  });
})();
