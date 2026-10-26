// Inicializa Sentry en la función de Vercel. Todas las páginas son estáticas,
// así que el script que inyecta @sentry/astro en páginas SSR nunca se carga:
// importarlo aquí asegura que corra antes de la primera petición.
import "../sentry.server.config"

import * as Sentry from "@sentry/astro"
import { defineMiddleware, sequence } from "astro:middleware"

// Todas las actions comparten la ruta /_actions/[...path]: les damos su nombre
// (POST /_actions/contact) para medir cada una por separado.
const nameActionSpans = defineMiddleware((context, next) => {
  if (context.url.pathname.startsWith("/_actions/")) {
    const name = `${context.request.method} ${context.url.pathname.replace(/\/$/, "")}`
    const span = Sentry.getActiveSpan()
    if (span) Sentry.updateSpanName(Sentry.getRootSpan(span), name)
    Sentry.getIsolationScope().setTransactionName(name)
  }
  return next()
})

// handleRequest nombra las transacciones por ruta (GET /api/sentry-test),
// captura los errores de endpoints y actions, y envía los eventos antes de
// que la función termine.
export const onRequest = sequence(Sentry.handleRequest(), nameActionSpans)
