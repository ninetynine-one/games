# Ninety Nine One — juegos

Portada de los juegos de Ninety Nine One en `games.ninetynineone.studio`: una ficha por juego, el formulario «Avísame de nuevas versiones» y el puente entre los juegos y el panel de gestión. Mismo stack que `website`: [Astro](https://astro.build), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (Base UI) y Sentry opcional.

Diseño y contrato con el panel: `rea/docs/publicacion-games-design.md` (fuera de este repositorio).

## Desarrollo

Requiere Node.js 24 o superior.

```sh
npm install
npm run dev -- --port 4330   # http://localhost:4330
npm run build                # genera dist/
npm run preview -- --port 4330
npm test                     # validación de /api/events
npm run typecheck
npm run lint
```

Cada juego se abre en `http://localhost:4330/<slug>/`.

## Juegos

Cada juego vive en su propio repositorio. Aquí solo está su compilación, en `public/<slug>/`. Para actualizar uno:

```sh
scripts/sync-game.sh ../../rea/jardineros jardineros
scripts/sync-game.sh ../../rea/ultima-hora ultima-hora
scripts/sync-game.sh ../../rea/chatarra chatarra
```

El script compila el juego con `npx vite build --base=/<slug>/` en una carpeta temporal (no toca el `dist/` del juego), revisa que el build no mencione la referencia de diseño y reemplaza `public/<slug>/`. Compila el árbol de trabajo tal como esté: haz el sync desde un commit limpio del juego.

Añadir un juego nuevo: una entrada en `src/data/games.ts` (slug, título, frase, estado, portada en `src/assets/covers/`) y un sync. El slug debe existir también en la tabla `games` del panel.

Portadas: el key art de cada juego (`assets/concept/key-art.jpg`), reducido a 1200 px de alto en WebP. Las ilustraciones se hicieron con ayuda de IA y cada ficha lo dice.

## Panel de gestión

El sitio es estático salvo dos rutas que corren como funciones en Vercel y llaman al panel (`../dashboard`, rutas `/api/games/*`) con `Authorization: Bearer <DASHBOARD_GAMES_SECRET>`. El secreto nunca llega al navegador.

- **Action `subscribe`** (`src/actions/index.ts`): valida correo, juegos, consentimiento y el campo trampa, y reenvía a `POST {DASHBOARD_GAMES_URL}/subscribe`. El panel guarda la inscripción como pendiente y envía el correo de confirmación.
- **`POST /api/events`** (`src/pages/api/events.ts`): recibe los lotes de telemetría de los juegos y los reenvía a `POST {DASHBOARD_GAMES_URL}/events`. Solo acepta el propio origen, hasta 32 KB y de 1 a 50 eventos. JSON mal formado o demasiado grande: `400`. Todo lo demás responde `204`, también si se descarta.

Variables (copiar `.env.example` a `.env`; en Vercel, *Settings → Environment Variables*):

- `DASHBOARD_GAMES_URL`: por ejemplo `http://localhost:3000/api/games`.
- `DASHBOARD_GAMES_SECRET`: el mismo valor que `GAMES_WEBHOOK_SECRET` en el panel.

Sin ellas, el formulario responde «No pudimos guardar tu inscripción.» y los eventos se descartan.

## Sentry y analítica

Igual que en `website`: `PUBLIC_SENTRY_DSN` (navegador, al compilar), `SENTRY_DSN` (servidor, al ejecutar) y `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` para los source maps. Sin DSN, Sentry no hace nada. Vercel Web Analytics cuenta visitas sin cookies. No hay Google Analytics ni panel de cookies, y el tema sigue al del sistema.

## Despliegue

`vercel.json` da caché larga a `/<slug>/assets/*` (nombres con hash) y desactiva los despliegues automáticos de ramas `feat/*`, `fix/*`, etc. El proyecto de Vercel y el dominio `games.ninetynineone.studio` todavía no existen: crearlos requiere el visto bueno del autor.

## Estructura

```
public/<slug>/          Compilación de cada juego (scripts/sync-game.sh)
scripts/sync-game.sh    Compila un juego y lo copia a public/<slug>/
src/
├── actions/index.ts    Action de inscripción (panel /subscribe)
├── assets/covers/      Portadas de los juegos
├── components/         Formulario de inscripción y componentes de shadcn/ui
├── data/games.ts       Juegos y datos del sitio
├── lib/dashboard.ts    Llamada al panel con el secreto
├── lib/events.ts       Validación del contrato de eventos
├── pages/index.astro   La portada
├── pages/api/events.ts Puente de telemetría (panel /events)
└── styles/             Tokens de la marca, los mismos de website
tests/                  node --test
docs/nombres.md         Búsqueda rápida de nombres
```
