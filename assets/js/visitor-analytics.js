(function () {
  "use strict";

  const client = window.ESC_SUPABASE;
  const visitorTokenKey = "esc-visitor-token-v1";
  const lastRecordedDateKey = "esc-visitor-recorded-date-v1";

  if (!client) {
    return;
  }

  const createUuid = () => {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  };

  const getKoreanDate = () =>
    new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const readStorage = (key) => {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        const value = storage?.getItem(key);
        if (value) {
          return value;
        }
      } catch {
        // Continue with the next storage option when browser storage is blocked.
      }
    }
    return null;
  };

  const writeStorage = (key, value) => {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        storage?.setItem(key, value);
        return;
      } catch {
        // Continue with the next storage option when browser storage is blocked.
      }
    }
  };

  const recordVisit = async () => {
    const today = getKoreanDate();
    if (readStorage(lastRecordedDateKey) === today) {
      return;
    }

    const visitorToken = readStorage(visitorTokenKey) ?? createUuid();
    writeStorage(visitorTokenKey, visitorToken);

    const { error } = await client.rpc("record_site_visit", {
      p_visitor_token: visitorToken,
    });
    if (error) {
      throw error;
    }

    writeStorage(lastRecordedDateKey, today);
  };

  recordVisit().catch((error) => {
    console.warn("방문자 통계를 기록하지 못했습니다.", error);
  });
})();
