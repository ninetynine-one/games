import * as Sentry from "@sentry/astro"
import type { APIRoute } from "astro"

import { gameSlugs } from "@/data/games"
import { postToDashboard } from "@/lib/dashboard"
import { withDevice } from "@/lib/device"
import {
  corsHeaders,
  isAllowedOrigin,
  MAX_BODY_BYTES,
  parseBatch,
} from "@/lib/events"

export const prerender = false

const reply = (status: number, request: Request) =>
  new Response(null, { status, headers: corsHeaders(request) })

// Preflight de las apps (fetch con JSON desde otro origen).
export const OPTIONS: APIRoute = ({ request }) => {
  const headers = corsHeaders(request)
  if (!headers["Access-Control-Allow-Origin"]) return reply(204, request)
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  })
}

export const POST: APIRoute = async ({ request, url }) => {
  const noContent = () => reply(204, request)
  const badRequest = () => reply(400, request)
  if (!isAllowedOrigin(request, url.origin)) return noContent()
  // Corta antes de leer un cuerpo enorme; el tamaño real se vuelve a medir abajo.
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    return badRequest()

  const result = parseBatch(await request.text(), gameSlugs)
  if (result.status === 400) return badRequest()
  if (!result.batch) return noContent()

  try {
    const { batch } = result
    const response = await postToDashboard("events", {
      ...batch,
      events: withDevice(batch.events, request.headers),
    })
    if (!response) {
      console.error(
        "[events] DASHBOARD_GAMES_URL or DASHBOARD_GAMES_SECRET is not set"
      )
    } else if (!response.ok) {
      console.error("[events] dashboard responded", response.status)
      Sentry.captureMessage(
        `[events] dashboard responded ${response.status}`,
        "warning"
      )
    }
  } catch (cause) {
    console.error("[events] dashboard request failed", cause)
    Sentry.captureException(cause, { tags: { route: "events" } })
  }
  // El juego no reintenta según la respuesta: siempre 204.
  return noContent()
}
