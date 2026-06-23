import "dotenv/config";

// Eén plek voor alle configuratie, zodat de rest van de code geen process.env
// hoeft te kennen. Ontbrekende waarden worden bij het opstarten gemeld.
export const config = {
  appId: process.env.IG_APP_ID,
  appSecret: process.env.IG_APP_SECRET,
  redirectUri: process.env.IG_REDIRECT_URI,
  igUserId: process.env.IG_USER_ID,
  apiVersion: process.env.IG_API_VERSION || "v22.0",
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
  apiKey: process.env.APP_API_KEY,
  port: Number(process.env.PORT || 3000),
};

// Basis-URL van de Instagram Graph API (Instagram Login-variant).
export const IG_GRAPH = `https://graph.instagram.com/${config.apiVersion}`;

// De scopes die we aanvragen bij de OAuth-flow.
export const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_messages",
  "instagram_business_manage_insights",
].join(",");

// Waarschuw vroeg als essentiële config ontbreekt; de tool blijft starten
// zodat je in elk geval de status-pagina kunt openen.
export function warnMissingConfig() {
  const required = ["appId", "appSecret", "redirectUri", "webhookVerifyToken"];
  const missing = required.filter((k) => !config[k]);
  if (missing.length) {
    const names = {
      appId: "IG_APP_ID",
      appSecret: "IG_APP_SECRET",
      redirectUri: "IG_REDIRECT_URI",
      webhookVerifyToken: "WEBHOOK_VERIFY_TOKEN",
    };
    console.warn(
      "[config] Ontbrekende .env-waarden:",
      missing.map((k) => names[k]).join(", "),
      "\n          Kopieer .env.example naar .env en vul ze in."
    );
  }
  if (!config.apiKey) {
    console.warn(
      "[config] APP_API_KEY ontbreekt: de /api/* endpoints zijn dan onbeschermd. Zet er een in productie altijd op."
    );
  }
}
