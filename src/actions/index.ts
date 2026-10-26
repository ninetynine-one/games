import * as Sentry from "@sentry/astro"
import { ActionError, defineAction } from "astro:actions"
import { z } from "astro/zod"

import { gameSlugs } from "@/data/games"
import { postToDashboard } from "@/lib/dashboard"

const failed = () =>
  new ActionError({
    code: "INTERNAL_SERVER_ERROR",
    message: "No pudimos guardar tu inscripción.",
  })

export const server = {
  subscribe: defineAction({
    accept: "form",
    input: z.object({
      email: z.email("Revisa el formato del correo.").max(254),
      games: z
        .array(z.enum(gameSlugs), "Elige al menos un juego.")
        .min(1, "Elige al menos un juego."),
      consent: z
        .boolean()
        .refine(Boolean, "Necesitamos tu permiso para escribirte."),
      // Campo trampa: invisible para personas, los bots lo llenan.
      website: z.string().max(0).optional(),
    }),
    handler: async ({ email, games }) => {
      // El panel guarda la inscripción como pendiente y manda el correo de
      // confirmación; responde igual exista o no el correo.
      let response: Response | null
      try {
        response = await postToDashboard("subscribe", {
          email,
          games: [...new Set(games)],
          consent: true,
          source: "games-home",
        })
      } catch (cause) {
        // Falla de red o tiempo de espera: llega a Sentry sin el correo.
        console.error("[subscribe] dashboard request failed", cause)
        Sentry.captureException(cause, { tags: { action: "subscribe" } })
        throw failed()
      }

      if (!response) {
        console.error(
          "[subscribe] DASHBOARD_GAMES_URL or DASHBOARD_GAMES_SECRET is not set"
        )
        Sentry.captureMessage(
          "[subscribe] dashboard games webhook is not configured",
          "error"
        )
        throw failed()
      }

      if (!response.ok) {
        console.error("[subscribe] dashboard responded", response.status)
        Sentry.captureException(
          new Error(`[subscribe] dashboard responded ${response.status}`),
          { tags: { action: "subscribe" } }
        )
        throw failed()
      }

      return { email }
    },
  }),
}
