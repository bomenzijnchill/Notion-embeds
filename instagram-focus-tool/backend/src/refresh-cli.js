// Handmatig het token verversen vanaf de command line: `npm run refresh`.
// Handig om eenmalig te testen of de refresh werkt.
import { refreshToken } from "./token-refresh.js";

try {
  const data = await refreshToken();
  const days = Math.round(data.expires_in / 86400);
  console.log(`Token vernieuwd. Opnieuw geldig voor ~${days} dagen.`);
} catch (err) {
  console.error(String(err));
  process.exit(1);
}
