import { config } from "./config.js";
import { igGet, igPost } from "./ig.js";
import { requireToken } from "./store.js";

// We hebben het IG user-id nodig. Bij voorkeur uit .env; anders uit het
// opgeslagen token (daar staat de user_id van de OAuth-stap in).
function getUserId() {
  if (config.igUserId) return config.igUserId;
  const t = requireToken();
  if (t.user_id) return String(t.user_id);
  throw new Error("Geen IG_USER_ID bekend. Zet het in .env of koppel opnieuw.");
}

// Story publiceren via het container-model: container aanmaken, bij video
// wachten tot verwerkt, daarna publiceren. De media moet op een publiek
// bereikbare URL staan; Meta haalt het bestand zelf op.
export async function publishStory({ imageUrl, videoUrl }) {
  if (!imageUrl && !videoUrl) {
    throw new Error("Geef imageUrl of videoUrl op.");
  }
  const token = requireToken().access_token;
  const ig = getUserId();

  // 1. container aanmaken
  const container = await igPost(
    `/${ig}/media`,
    videoUrl
      ? { media_type: "STORIES", video_url: videoUrl }
      : { media_type: "STORIES", image_url: imageUrl },
    token
  );

  // 2. video: wachten tot verwerkt
  if (videoUrl) {
    let ready = false;
    for (let i = 0; i < 20; i++) {
      const s = await igGet(`/${container.id}?fields=status_code`, token);
      if (s.status_code === "FINISHED") {
        ready = true;
        break;
      }
      if (s.status_code === "ERROR") throw new Error("Verwerking van de video mislukt.");
      await new Promise((r) => setTimeout(r, 3000));
    }
    if (!ready) throw new Error("Time-out: video was na ~60s nog niet verwerkt.");
  }

  // 3. publiceren
  const published = await igPost(`/${ig}/media_publish`, { creation_id: container.id }, token);
  return published; // { id }
}

// Insights voor een gepubliceerde story-media-id. reach en replies zijn
// doorgaans beschikbaar; welke metrics precies wisselt per accounttype.
export async function getStoryInsights(mediaId) {
  const token = requireToken().access_token;
  return igGet(`/${mediaId}/insights?metric=reach,replies`, token);
}

// Recente eigen media ophalen, gefilterd op stories. Handig om in de app
// een lijstje te tonen waarvan je insights kunt opvragen.
export async function listRecentStories(limit = 25) {
  const token = requireToken().access_token;
  const ig = getUserId();
  // Het /stories-endpoint geeft de nu actieve stories (max 24u oud).
  const fields = "id,media_type,media_url,thumbnail_url,permalink,timestamp";
  const data = await igGet(`/${ig}/stories?fields=${fields}&limit=${limit}`, token);
  return data.data || [];
}
