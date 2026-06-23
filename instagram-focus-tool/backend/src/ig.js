import { IG_GRAPH } from "./config.js";

// Twee kleine helpers, hergebruikt door publiceren, insights en DM's,
// zodat er geen dubbele fetch-logica ontstaat.

export async function igGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${IG_GRAPH}${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`IG GET ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function igPost(path, body, token) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${IG_GRAPH}${path}${sep}access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`IG POST ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}
