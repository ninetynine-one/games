import * as Sentry from "@sentry/astro"
import type { APIRoute } from "astro"

import { gameSlugs } from "@/data/games"
import { postToDashboard } from "@/lib/dashboard"
import { withDevice } from "@/lib/device"
import { isSameOrigin, MAX_BODY_BYTES, parseBatch } from "@/lib/events"

export const prerender = false

const noContent = () => new Response(null, { status: 204 })
const badRequest = () => new Response(null, { status: 400 })

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOrigin(request, url.origin)) return noContent()
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
