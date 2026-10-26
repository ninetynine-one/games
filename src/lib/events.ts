import { z } from "astro/zod"

// Contrato juego → games → panel (rea/docs/publicacion-games-design.md).
export const MAX_BODY_BYTES = 32 * 1024
const MAX_DATA_BYTES = 2 * 1024

const eventTypes = [
  "session_start",
  "level_start",
  "wave_reached",
  "level_end",
  "reward_pick",
  "crew",
  "tutorial_step",
  "settings_change",
] as const

// Objeto plano: valores simples, sin anidar.
const flatData = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .refine(
    (data) =>
      new TextEncoder().encode(JSON.stringify(data)).length <= MAX_DATA_BYTES
  )

const step = z.number().int().nullable()

export function batchSchema(slugs: readonly [string, ...string[]]) {
  return z.object({
    game: z.enum(slugs),
    version: z.string().min(1).max(32),
    player: z.uuid({ version: "v4" }),
    session: z.uuid({ version: "v4" }),
    events: z
      .array(
        z.object({
          type: z.enum(eventTypes),
          at: z.iso.datetime(),
          level: step.default(null),
          wave: step.default(null),
          data: flatData.default({}),
        })
      )
      .min(1)
      .max(50),
  })
}

export type ParseResult =
  | { status: 400 }
  | { status: 204; batch: z.infer<ReturnType<typeof batchSchema>> | null }

// 400 si pasa de 32 KB o no es JSON; si no cumple el contrato, se descarta (batch null).
export function parseBatch(
  raw: string,
  slugs: readonly [string, ...string[]]
): ParseResult {
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES)
    return { status: 400 }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { status: 400 }
  }
  const parsed = batchSchema(slugs).safeParse(json)
  return { status: 204, batch: parsed.success ? parsed.data : null }
}

// Solo el propio sitio. sendBeacon y fetch mandan Origin en un POST;
// si falta, vale Sec-Fetch-Site. Sin ninguno de los dos, no viene de un navegador nuestro.
export function isSameOrigin(request: Request, origin: string) {
  const header = request.headers.get("origin")
  if (header) return header === origin
  return request.headers.get("sec-fetch-site") === "same-origin"
}
