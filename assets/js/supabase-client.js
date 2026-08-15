(function () {
  "use strict";

  const config = window.ESC_SUPABASE_CONFIG;

  if (!config?.url || !config?.publishableKey || !config?.officialOrigin) {
    console.error("Supabase configuration is missing.");
    return;
  }

  if (
    window.location.origin !== config.officialOrigin ||
    window.ESC_OFFICIAL_ORIGIN !== config.officialOrigin
  ) {
    console.error("Supabase access is available only on the official website.");
    return;
  }

  if (!window.supabase?.createClient) {
    console.error("The Supabase JavaScript client could not be loaded.");
    return;
  }

  window.ESC_SUPABASE = window.supabase.createClient(
    config.url,
    config.publishableKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    },
  );
})();
