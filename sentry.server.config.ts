import * as Sentry from "@sentry/astro"

// Se lee en tiempo de ejecución (función de Vercel). Sin DSN, Sentry no hace nada.
const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    // SDK v11: reemplaza a sendDefaultPii. La inscripción lleva el correo y
    // los eventos vienen de los jugadores: nunca se adjuntan cuerpos ni cookies.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
      httpHeaders: {
        request: { deny: ["cookie", "authorization", "x-sentry-test"] },
        response: false,
      },
    },
    tracesSampleRate: 1.0,
    // Segunda capa, por si alguna integración adjunta datos de la petición.
    beforeSend(event) {
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        if (event.request.headers) {
          delete event.request.headers.cookie
          delete event.request.headers["x-sentry-test"]
        }
      }
      return event
    },
  })
}
