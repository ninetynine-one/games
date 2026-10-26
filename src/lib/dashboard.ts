import { DASHBOARD_GAMES_SECRET, DASHBOARD_GAMES_URL } from "astro:env/server"

// Llama a las rutas de juegos del panel con el secreto compartido.
// Sin configuración devuelve null: quien llama decide qué responder.
export function postToDashboard(path: "subscribe" | "events", body: unknown) {
  if (!DASHBOARD_GAMES_URL || !DASHBOARD_GAMES_SECRET) return null
  return fetch(`${DASHBOARD_GAMES_URL.replace(/\/$/, "")}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DASHBOARD_GAMES_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
}
