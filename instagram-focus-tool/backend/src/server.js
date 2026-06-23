import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config, warnMissingConfig } from "./config.js";
import { authRouter } from "./auth.js";
import { webhookRouter } from "./messages.js";
import { apiRouter } from "./api.js";
import { startRefreshScheduler } from "./token-refresh.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// We hebben de ruwe body nodig voor de webhook-HMAC-controle, daarom bewaren
// we 'm tijdens het JSON-parsen.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// OAuth-routes (/auth/start, /auth/callback)
app.use(authRouter);

// Webhook (/webhook GET + POST)
app.use(webhookRouter);

// JSON-API voor de iOS-app (/api/*)
app.use("/api", apiRouter);

// Eenvoudige statuspagina met een koppel-knop.
app.use(express.static(join(__dirname, "..", "public")));

warnMissingConfig();
startRefreshScheduler();

app.listen(config.port, () => {
  console.log(`Server op http://localhost:${config.port}`);
  console.log(`Koppelen: open http://localhost:${config.port}/auth/start (via je ngrok-URL).`);
});
