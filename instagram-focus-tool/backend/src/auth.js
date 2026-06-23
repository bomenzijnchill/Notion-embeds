import { Router } from "express";
import { config, SCOPES } from "./config.js";
import { saveToken } from "./store.js";

// OAuth-flow: eenmalig doorlopen om een long-lived token (60 dagen) te krijgen.
export const authRouter = Router();

// Stap 1: stuur jezelf naar de Instagram-autorisatiepagina.
authRouter.get("/auth/start", (req, res) => {
  if (!config.appId || !config.redirectUri) {
    return res
      .status(500)
      .send("IG_APP_ID of IG_REDIRECT_URI ontbreekt in .env.");
  }
  const url = new URL("https://api.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  res.redirect(url.toString());
});

// Stap 2: Instagram stuurt je terug met een ?code=
authRouter.get("/auth/callback", async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      return res.status(400).send(`Instagram weigerde: ${error_description || error}`);
    }
    if (!code) {
      return res.status(400).send("Geen ?code ontvangen van Instagram.");
    }

    // code -> short-lived token (form-encoded, host api.instagram.com)
    const form = new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
      code: String(code),
    });
    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: form,
    });
    const short = await shortRes.json();
    if (!shortRes.ok) {
      throw new Error(`short-lived token mislukt: ${JSON.stringify(short)}`);
    }
    // short = { access_token, user_id, permissions }

    // short-lived -> long-lived (60 dagen, host graph.instagram.com)
    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", config.appSecret);
    longUrl.searchParams.set("access_token", short.access_token);
    const longRes = await fetch(longUrl);
    const long = await longRes.json();
    if (!longRes.ok) {
      throw new Error(`long-lived token mislukt: ${JSON.stringify(long)}`);
    }
    // long = { access_token, token_type, expires_in }

    saveToken({
      access_token: long.access_token,
      expires_in: long.expires_in,
      user_id: short.user_id,
    });

    res.send(
      "<h2>Gekoppeld ✅</h2><p>Token opgeslagen. Je kunt dit tabblad sluiten en de app gebruiken.</p>"
    );
  } catch (err) {
    console.error("[auth/callback]", err);
    res.status(500).send(String(err));
  }
});
