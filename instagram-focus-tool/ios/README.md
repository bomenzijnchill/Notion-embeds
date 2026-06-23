# FocusGram — iOS-app (SwiftUI)

Een afleidingsvrije "afstandsbediening" voor je eigen Instagram: stories
posten, je story-prestaties bekijken en inkomende DM's beantwoorden. De app
praat uitsluitend met je eigen Node-backend (`../backend`) — er is geen feed.

## Openen in Xcode

### Optie A — met XcodeGen (aanbevolen, reproduceerbaar)

```bash
brew install xcodegen
cd ios
xcodegen generate
open FocusGram.xcodeproj
```

### Optie B — handmatig een project maken

1. Xcode → **File ▸ New ▸ Project… ▸ iOS ▸ App**.
2. Product Name: `FocusGram`, Interface: **SwiftUI**, Language: **Swift**.
3. Verwijder de standaard `ContentView.swift` en het gegenereerde `App`-bestand.
4. Sleep de map `Sources/` (alle `.swift`-bestanden) de Xcode-navigator in,
   met "Copy items if needed" aangevinkt.
5. Open in je target → **Info** de sleutel **App Transport Security Settings**
   → **Allow Arbitrary Loads = YES** (nodig om je lokale/ngrok-backend te
   bereiken tijdens ontwikkeling).
6. Minimaal iOS 16.

## Eerste keer gebruiken

1. Start de backend en je ngrok-tunnel (zie `../backend/README.md` /
   `../README.md`).
2. Run de app op de simulator of je iPhone.
3. Ga naar **Instellingen** en vul in:
   - **Server-URL**: je ngrok-HTTPS-URL, bijv. `https://abc123.ngrok.io`
     (zonder slash op het eind).
   - **API-sleutel**: dezelfde waarde als `APP_API_KEY` in de backend-`.env`.
4. Tik **Status verversen**. Staat er nog "Gekoppeld: Nee", tik dan
   **Koppel met Instagram** om eenmalig in te loggen via Safari.

## Schermen

- **Posten** — plaats een story vanaf een publieke media-URL (foto of video).
- **Prestaties** — je nu actieve stories met bereik en reacties.
- **Inbox** — nieuw binnengekomen DM's; antwoorden kan binnen het 24-uursvenster.
- **Instellingen** — backend-URL, API-sleutel en koppelstatus.

> De app slaat geen Instagram-token op; dat staat veilig op je backend. De app
> bewaart alleen de server-URL en API-sleutel lokaal in UserDefaults.
