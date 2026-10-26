import * as Sentry from "@sentry/astro"
import { PUBLIC_SENTRY_DSN } from "astro:env/client"

// Sin DSN (desarrollo local, previews sin la variable) Sentry no hace nada.
if (PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,
    // Vercel expone sus variables de sistema con el prefijo PUBLIC_ en Astro.
    environment: import.meta.env.PUBLIC_VERCEL_ENV || "development",
    release: import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
    // SDK v11: reemplaza a sendDefaultPii. Nada de usuario, cookies ni cuerpos.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
    },
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
    // Solo propagamos trazas a nuestro propio origen.
    tracePropagationTargets: [/^\/(?!\/)/, window.location.origin],
    // Session Replay solo cuando ocurre un error, y con todo enmascarado.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })

  // Replay se carga después, para no pesar en la primera carga.
  const replayReady = Sentry.lazyLoadIntegration("replayIntegration")
    .then((replayIntegration) => {
      Sentry.addIntegration(
        replayIntegration({ maskAllText: true, blockAllMedia: true })
      )
    })
    .catch(() => {})

  // Prueba de extremo a extremo en producción: ?sentry-test=1
  if (new URLSearchParams(window.location.search).get("sentry-test") === "1") {
    void replayReady.then(() => {
      setTimeout(() => {
        throw new Error("Sentry test error (client)")
      })
    })
  }
}
