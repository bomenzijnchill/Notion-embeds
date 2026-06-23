# Instagram Focus-tool

Een afleidingsvrije persoonlijke tool voor je **eigen** Instagram-account:
stories posten, je eigen story-prestaties bekijken en inkomende DM's afhandelen.
**Geen feed, geen andermans stories** — de officiële Graph API geeft je sowieso
alleen toegang tot je eigen data. Precies dat maakt de tool afleidingsvrij.

```
┌─────────────┐        x-api-key         ┌──────────────────────┐      Graph API
│  iOS-app    │  ───────────────────────▶│   Node.js + Express  │ ───────────────▶  Instagram
│ (SwiftUI)   │   /api/status, /stories  │   backend            │   publiceren,
│  FocusGram  │   /conversations, reply  │                      │   insights, DM's
└─────────────┘                          └──────────┬───────────┘
                                                     │
   Instagram  ──────  webhook (DM's)  ──────────────▶│  token.json + messages.json
```

Twee onderdelen:

| Map        | Wat                                                                 |
|------------|---------------------------------------------------------------------|
| `backend/` | Node.js + Express: OAuth, token-refresh, story publiceren, insights, DM-webhook + JSON-API. |
| `ios/`     | SwiftUI-app die met de backend praat. Geen eigen Instagram-koppeling. |

> Dit is een **prototype**. Het draait in Meta's Development-modus met jezelf
> als Instagram-tester — geen App Review nodig zolang alleen jij het gebruikt.

## Snelstart

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # vul je Meta-app-gegevens in
ngrok http 3000           # publieke HTTPS-URL die Meta kan bereiken
npm start
```

Vul in `.env` minimaal `IG_APP_ID`, `IG_APP_SECRET`, `IG_REDIRECT_URI`
(je ngrok-URL + `/auth/callback`), `WEBHOOK_VERIFY_TOKEN` en `APP_API_KEY`.

Ga daarna naar `https://<jouw-ngrok>.ngrok.io/auth/start` om eenmalig te
koppelen. Het long-lived token (60 dagen) wordt opgeslagen in
`backend/token.json` en automatisch ververst.

### 2. iOS-app

```bash
cd ios
xcodegen generate && open FocusGram.xcodeproj   # of zie ios/README.md
```

In de app onder **Instellingen**: vul je ngrok-URL en dezelfde `APP_API_KEY` in.

## Vooraf bij Meta instellen (eenmalig)

Op [developers.facebook.com](https://developers.facebook.com):

1. Maak een app van het type **Business**.
2. Voeg het product **Instagram** toe (Instagram API with Instagram Login).
3. Zet je eigen account op **Creator** of **Business** en voeg jezelf toe als
   Instagram-tester onder de app-rollen.
4. Noteer **App ID** en **App Secret** → in `.env`.
5. Vul je **Redirect URI** in (je ngrok-URL + `/auth/callback`).
6. Stel de **Webhook** in: callback-URL = `<ngrok>/webhook`, verify-token =
   je `WEBHOOK_VERIFY_TOKEN`, en abonneer je op het veld `messages` voor het
   Instagram-object.

Aangevraagde scopes:

```
instagram_business_basic
instagram_business_content_publish
instagram_business_manage_messages
instagram_business_manage_insights
```

## API van de backend (gebruikt door de app)

| Endpoint                                   | Doel                                  |
|--------------------------------------------|---------------------------------------|
| `GET  /api/status`                         | Gekoppeld? Token-vervaldatum.         |
| `POST /api/stories/publish`                | Story plaatsen (`imageUrl`/`videoUrl`).|
| `GET  /api/stories`                        | Nu actieve stories.                   |
| `GET  /api/stories/:mediaId/insights`      | Bereik + reacties van een story.      |
| `GET  /api/conversations`                  | Opgevangen DM's, gegroepeerd.         |
| `POST /api/conversations/:userId/reply`    | Antwoorden binnen 24u-venster.        |
| `GET  /auth/start` · `GET /auth/callback`  | Eenmalige OAuth-koppeling (browser).  |
| `GET/POST /webhook`                        | Meta-webhook (verificatie + DM's).    |

Alle `/api/*`-routes vereisen de header `x-api-key: <APP_API_KEY>`.

## Waar het (bewust) stopt

Wat **goed** werkt: stories posten, je eigen story-inzichten en de
afleidingsvrije omgeving.

Wat de officiële API **niet** geeft, en deze tool dus ook niet:

- **Geen DM-historie.** Je vangt alleen nieuwe inkomende berichten op vanaf het
  moment dat de webhook draait.
- **24-uurs antwoordvenster.** Daarna kan alleen nog een Human-Agent-bericht
  (tot 7 dagen, voor support).
- **Geen groepsgesprekken.**
- Berichten in de Requests-map die 30 dagen inactief zijn, komen niet terug.

Tools die wél "alles" beloven, scrapen Instagram buiten de officiële API om.
Dat botst met Meta's voorwaarden en kan je account kosten — bewust niet gedaan.

## Productie-aandachtspunten

- Vervang ngrok door een stabiele HTTPS-host.
- `token.json`/`messages.json` zijn een simpele JSON-store; voor meerdere
  gebruikers of robuustheid wil je een echte database.
- App Review is alleen nodig als de tool ooit voor **andere** accounts dan het
  jouwe moet werken; `instagram_business_manage_messages` wordt het strengst
  bekeken.
