# Backend — Instagram Focus-tool

Node.js + Express. OAuth-koppeling, token-refresh, story publiceren, insights,
DM-webhook en een JSON-API voor de iOS-app.

## Draaien

```bash
npm install
cp .env.example .env      # vul je Meta-app-gegevens in
ngrok http 3000           # publieke HTTPS-URL voor Meta
npm start                 # of: npm run dev  (auto-restart)
```

Koppel daarna eenmalig via `https://<jouw-ngrok>.ngrok.io/auth/start`.

Token handmatig verversen (test): `npm run refresh`.

## Bestanden

| Bestand                  | Doel                                                        |
|--------------------------|-------------------------------------------------------------|
| `src/server.js`          | Wiret alles, vangt de ruwe body voor HMAC, start scheduler. |
| `src/config.js`          | `.env` inlezen, scopes, config-waarschuwingen.              |
| `src/ig.js`              | `igGet` / `igPost` helpers.                                 |
| `src/store.js`           | Token + DM-opslag (JSON), gespreksgroepering.               |
| `src/auth.js`            | `/auth/start` + `/auth/callback` (OAuth → long-lived token).|
| `src/token-refresh.js`   | Periodiek verversen vóór de 60 dagen om zijn.               |
| `src/stories.js`         | Story publiceren, insights, actieve stories.                |
| `src/messages.js`        | Webhook (verificatie + HMAC + DM's) en antwoorden.          |
| `src/api.js`             | `/api/*` voor de iOS-app, beschermd met `x-api-key`.        |

`token.json` en `messages.json` worden lokaal aangemaakt en staan in
`.gitignore`. Zie de hoofd-`README.md` voor de Meta-instellingen en de API-tabel.
