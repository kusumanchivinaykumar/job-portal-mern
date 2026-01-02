import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://7c30d2fd705e995ae3c0dfa255322599@o4510426348322816.ingest.us.sentry.io/4510498300493824",
  integrations: [
    Sentry.mongooseIntegration()

  ],
  sendDefaultPii: true,
});
