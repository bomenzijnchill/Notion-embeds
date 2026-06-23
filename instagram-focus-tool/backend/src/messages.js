import { Router } from "express";
import crypto from "node:crypto";
import { config } from "./config.js";
import { igPost } from "./ig.js";
import { requireToken, appendMessage } from "./store.js";

export const webhookRouter = Router();

// Verificatie: Meta doet een GET met hub.challenge bij het instellen.
webhookRouter.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === config.webhookVerifyToken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Controleer de X-Hub-Signature-256 header (HMAC met je App Secret) voordat
// je de payload vertrouwt. req.rawBody wordt gezet in server.js.
function validSignature(req) {
  if (!config.appSecret) return false;
  const header = req.get("x-hub-signature-256");
  if (!header || !req.rawBody) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", config.appSecret).update(req.rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Inkomende DM's. We bevestigen snel (200) en verwerken daarna, anders
// herhaalt Meta de levering.
webhookRouter.post("/webhook", (req, res) => {
  if (!validSignature(req)) {
    return res.sendStatus(403);
  }
  res.sendStatus(200);

  try {
    const entries = req.body.entry || [];
    for (const entry of entries) {
      const messaging = entry.messaging || [];
      for (const event of messaging) {
        const msg = event.message;
        // Eigen verstuurde berichten komen als echo terug: overslaan.
        if (!msg || msg.is_echo) continue;
        const stored = appendMessage({
          userId: event.sender?.id,
          direction: "in",
          text: msg.text || "",
          mid: msg.mid || null,
          timestamp: event.timestamp || Date.now(),
        });
        console.log(`DM van ${stored.userId}: ${stored.text}`);
      }
    }
  } catch (err) {
    console.error("[webhook] verwerken mislukt:", err);
  }
});

// Antwoorden binnen het 24-uursvenster. Slaat het verstuurde bericht ook
// lokaal op zodat het in de inbox verschijnt.
export async function replyToDm(recipientId, text) {
  const token = requireToken().access_token;
  const result = await igPost(
    `/me/messages`,
    { recipient: { id: recipientId }, message: { text } },
    token
  );
  appendMessage({
    userId: recipientId,
    direction: "out",
    text,
    mid: result.message_id || null,
    timestamp: Date.now(),
  });
  return result;
}
