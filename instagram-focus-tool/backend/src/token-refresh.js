import { loadToken, saveToken, requireToken } from "./store.js";

// Een long-lived token vervalt na 60 dagen en moet minstens 24 uur oud zijn
// om te kunnen verversen. We draaien dit periodiek zodat je nooit tegen de
// grens aanloopt.
export async function refreshToken() {
  const t = requireToken();

  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", t.access_token);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`refresh mislukt: ${JSON.stringify(data)}`);
  }
  // data = { access_token, token_type, expires_in }
  saveToken({ access_token: data.access_token, expires_in: data.expires_in });
  return data;
}

// Controleert dagelijks of het token binnen ~10 dagen vervalt en ververst dan.
// Bewust simpel met setInterval; voor productie kun je dit ook via cron doen.
export function startRefreshScheduler() {
  const DAY = 24 * 60 * 60 * 1000;
  const TEN_DAYS = 10 * DAY;

  async function maybeRefresh() {
    const t = loadToken();
    if (!t) return; // nog niet gekoppeld
    const ageMs = Date.now() - (t.updated_at || 0);
    const msUntilExpiry = (t.expires_at || 0) - Date.now();
    // Minstens 24u oud (Meta-eis) en binnen 10 dagen van vervallen.
    if (ageMs > DAY && msUntilExpiry < TEN_DAYS) {
      try {
        await refreshToken();
        console.log("[token] vernieuwd, geldig voor opnieuw ~60 dagen.");
      } catch (err) {
        console.error("[token] vernieuwen mislukt:", err.message);
      }
    }
  }

  // Eén keer kort na opstarten, daarna elke 24 uur.
  setTimeout(maybeRefresh, 10_000);
  setInterval(maybeRefresh, DAY);
}
