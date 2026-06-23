import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Bewust simpel: twee JSON-bestanden naast de backend. Geen database nodig
// voor een tool die alleen voor jou draait. Beide staan in .gitignore.
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TOKEN_FILE = join(ROOT, "token.json");
const MESSAGES_FILE = join(ROOT, "messages.json");

// --- Token ---

export function saveToken({ access_token, expires_in, user_id }) {
  const current = loadToken() || {};
  const data = {
    access_token,
    expires_at: Date.now() + expires_in * 1000,
    // user_id alleen overschrijven als we er een nieuwe binnenkrijgen.
    user_id: user_id ?? current.user_id ?? null,
    updated_at: Date.now(),
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  return data;
}

export function loadToken() {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

// Gooit een duidelijke fout als er nog niet gekoppeld is.
export function requireToken() {
  const t = loadToken();
  if (!t || !t.access_token) {
    throw new Error("Nog niet gekoppeld. Doorloop eerst /auth/start in de browser.");
  }
  return t;
}

// --- DM's ---
// We vangen alleen vooruit nieuwe inkomende berichten op (API-beperking).
// We bewaren ze hier zodat je iOS-inbox iets te tonen heeft.

function readMessages() {
  if (!existsSync(MESSAGES_FILE)) return [];
  try {
    return JSON.parse(readFileSync(MESSAGES_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeMessages(list) {
  writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2));
}

export function appendMessage(msg) {
  const list = readMessages();
  list.push(msg);
  // Houd het bestand behapbaar.
  const trimmed = list.slice(-500);
  writeMessages(trimmed);
  return msg;
}

// Berichten gegroepeerd per gesprekspartner, nieuwste gesprek eerst.
export function getConversations() {
  const list = readMessages();
  const byUser = new Map();
  for (const m of list) {
    if (!byUser.has(m.userId)) byUser.set(m.userId, []);
    byUser.get(m.userId).push(m);
  }
  const conversations = [...byUser.entries()].map(([userId, messages]) => {
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    const last = sorted[sorted.length - 1];
    // 24-uurs antwoordvenster gerekend vanaf het laatste INKOMENDE bericht.
    const lastInbound = [...sorted].reverse().find((m) => m.direction === "in");
    const windowMs = 24 * 60 * 60 * 1000;
    const canReplyUntil = lastInbound ? lastInbound.timestamp + windowMs : 0;
    return {
      userId,
      messages: sorted,
      lastMessageAt: last.timestamp,
      lastText: last.text,
      canReply: Date.now() < canReplyUntil,
      canReplyUntil,
    };
  });
  conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  return conversations;
}
