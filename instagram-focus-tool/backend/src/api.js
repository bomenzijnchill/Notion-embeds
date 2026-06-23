import { Router } from "express";
import { config } from "./config.js";
import { loadToken } from "./store.js";
import { getConversations } from "./store.js";
import { publishStory, getStoryInsights, listRecentStories } from "./stories.js";
import { replyToDm } from "./messages.js";

// JSON-API waar de iOS-app mee praat. Beschermd met een simpele gedeelde
// sleutel (x-api-key), genoeg voor een tool die alleen jij gebruikt.
export const apiRouter = Router();

apiRouter.use((req, res, next) => {
  if (!config.apiKey) return next(); // geen sleutel ingesteld -> open (alleen dev)
  if (req.get("x-api-key") === config.apiKey) return next();
  res.status(401).json({ error: "Ongeldige of ontbrekende x-api-key." });
});

// Statusoverzicht: gekoppeld? wanneer verloopt het token?
apiRouter.get("/status", (req, res) => {
  const t = loadToken();
  res.json({
    connected: Boolean(t?.access_token),
    userId: t?.user_id ?? config.igUserId ?? null,
    tokenExpiresAt: t?.expires_at ?? null,
    tokenUpdatedAt: t?.updated_at ?? null,
  });
});

// Story publiceren.
apiRouter.post("/stories/publish", async (req, res) => {
  try {
    const { imageUrl, videoUrl } = req.body || {};
    const result = await publishStory({ imageUrl, videoUrl });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

// Nu actieve stories ophalen.
apiRouter.get("/stories", async (req, res) => {
  try {
    res.json({ stories: await listRecentStories() });
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

// Insights voor één story-media-id.
apiRouter.get("/stories/:mediaId/insights", async (req, res) => {
  try {
    res.json(await getStoryInsights(req.params.mediaId));
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

// Inbox: gesprekken opgebouwd uit de opgevangen DM's.
apiRouter.get("/conversations", (req, res) => {
  res.json({ conversations: getConversations() });
});

// Antwoorden op een DM (binnen het 24-uursvenster).
apiRouter.post("/conversations/:userId/reply", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: "text ontbreekt." });
    const result = await replyToDm(req.params.userId, text);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});
