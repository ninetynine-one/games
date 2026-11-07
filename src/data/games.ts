import jardineros from "@/assets/covers/jardineros.webp"
import ultimaHora from "@/assets/covers/ultima-hora.webp"
import chatarra from "@/assets/covers/chatarra.webp"

export const site = {
  name: "Ninety Nine One",
  title: "Juegos — Ninety Nine One",
  description:
    "Los juegos de Ninety Nine One, para jugar en el navegador. Demos gratis, sin cuenta y sin instalar nada.",
  home: "https://ninetynineone.studio",
  privacy: "https://ninetynineone.studio/privacidad",
  email: "hola@ninetynineone.studio",
  legalName: "Ninety Nine One SpA",
  location: "Santiago de Chile",
  // Contacto de la política de privacidad de los juegos.
  privacyEmail: "contacto@ninetynineone.studio",
}

// Cada juego vive en public/<slug>/ (scripts/sync-game.sh). Añadir uno es
// una entrada aquí más un sync. El slug también es el de la tabla games del panel.
export const games = [
  {
    slug: "jardineros",
    title: "Los últimos jardineros del cielo",
    tagline: "Cultiva un fuerte vivo y defiende el Árbol Madre de las hordas.",
    status: "Demo",
    cover: jardineros,
    alt: "Un gran árbol con un corazón verde brillante sobre una isla flotante entre nubes, cuidado por tres pequeños jardineros.",
  },
  {
    slug: "ultima-hora",
    title: "La última hora",
    tagline:
      "Defiende el gran reloj entre dos épocas que cambian a cada campanada.",
    status: "Demo",
    cover: ultimaHora,
    alt: "Un enorme reloj dorado iluminado en una plaza de noche, con engranajes flotando en el cielo y tres niños mirándolo.",
  },
  {
    slug: "chatarra",
    title: "Chatarra",
    tagline: "Un robot reparador, un reactor y piezas que se vuelven munición.",
    status: "Demo",
    cover: chatarra,
    alt: "Una torre de contenedores oxidados con ventanas encendidas, plantas y pequeños robots, bajo una grúa.",
  },
] as const

export const gameSlugs = games.map((game) => game.slug) as [
  (typeof games)[number]["slug"],
  ...(typeof games)[number]["slug"][],
]
