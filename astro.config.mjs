// @ts-check

import { existsSync } from "node:fs"

import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"
import react from "@astrojs/react"
import vercel from "@astrojs/vercel"
import sentry from "@sentry/astro"

// En desarrollo, /<slug>/ sirve public/<slug>/index.html, como hace Vercel.
/** @returns {import("vite").Plugin} */
function gameIndex() {
  return {
    name: "game-index",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const slug = req.url?.match(/^\/([a-z0-9-]+)\/(?:\?.*)?$/)?.[1]
        if (slug && existsSync(`public/${slug}/index.html`))
          req.url = `/${slug}/index.html`
        next()
      })
    },
  }
}

// https://astro.build/config
export default defineConfig({
  site: "https://games.ninetynineone.studio",
  adapter: vercel(),
  integrations: [
    react(),
    // Runtime en sentry.client.config.ts y sentry.server.config.ts.
    sentry({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.env.VERCEL_GIT_COMMIT_SHA
        ? { name: process.env.VERCEL_GIT_COMMIT_SHA }
        : undefined,
      // Los source maps solo se suben si hay token; sin él, el build sigue igual.
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      telemetry: false,
      // El servidor se inicializa en src/middleware.ts, igual que en website.
      enabled: { client: true, server: false },
    }),
  ],
  vite: {
    plugins: [tailwindcss(), gameIndex()],
  },
  env: {
    schema: {
      // Rutas de juegos del panel de gestión, p. ej. http://localhost:3000/api/games
      DASHBOARD_GAMES_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        url: true,
      }),
      // Igual a GAMES_WEBHOOK_SECRET en el panel.
      DASHBOARD_GAMES_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      PUBLIC_SENTRY_DSN: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      SENTRY_DSN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
})
