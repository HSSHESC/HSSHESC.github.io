(function () {
  "use strict";

  const config = window.ESC_SUPABASE_CONFIG;

  if (!config?.url || !config?.publishableKey) {
    console.error("Supabase configuration is missing.");
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
