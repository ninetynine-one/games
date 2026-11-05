// Contexto que el sitio agrega a session_start: país, navegador, sistema y
// marca. Sale de las cabeceras de la petición; el juego no lo manda ni se
// guarda la IP.
type HeaderBag = { get(name: string): string | null }

// La marca por el prefijo del modelo (Sec-CH-UA-Model o el User-Agent).
const BRANDS: [RegExp, string][] = [
  [/^(SM-|Galaxy)/i, "Samsung"],
  [/^Pixel/i, "Google"],
  [/^(moto|XT\d{4})/i, "Motorola"],
  [/^(Redmi|POCO|Mi |M\d{4}[A-Z]|2\d{4}[0-9A-Z]{3,}$)/i, "Xiaomi"],
  [/^RMX\d/i, "realme"],
  [/^CPH\d/i, "OPPO"],
  [/^(vivo|V2\d{3})/i, "vivo"],
  [/^(ONEPLUS|[A-Z]{2}\d{4}$)/i, "OnePlus"],
  [/^(HUAWEI|[A-Z]{3}-[A-Z]{1,2}\d)/i, "Huawei"],
  [/^(Nokia|TA-\d)/i, "Nokia"],
]

const BROWSERS: [RegExp, string][] = [
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Edg(A|iOS)?\//, "Edge"],
  [/(OPR|Opera)\//, "Opera"],
  [/(Firefox|FxiOS)\//, "Firefox"],
  [/CriOS\//, "Chrome"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
]

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Mac OS X/, "macOS"],
  [/Linux/, "Linux"],
]

const first = (list: [RegExp, string][], text: string) =>
  list.find(([re]) => re.test(text))?.[1] ?? null

// Chrome recortado manda "Android 10; K": sin modelo real.
function uaModel(ua: string) {
  const model = ua
    .match(
      /Android [\d.]+; (?:[a-z]{2}[-_][a-z]{2}; )?([^;)]+?)(?: Build\/|\))/i
    )?.[1]
    ?.trim()
  return model && model !== "K" ? model : null
}

export function deviceContext(headers: HeaderBag) {
  const ua = headers.get("user-agent") ?? ""
  const os = first(SYSTEMS, ua)
  const hint = headers.get("sec-ch-ua-model")?.replace(/^"|"$/g, "").trim()
  const model = (hint || uaModel(ua))?.slice(0, 64) || null
  const brand =
    os === "iOS"
      ? "Apple"
      : os === "Android"
        ? ((model && first(BRANDS, model)) ?? "Android")
        : null
  const country = headers.get("x-vercel-ip-country")
  return {
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    browser: first(BROWSERS, ua),
    os,
    brand,
    model,
  }
}

// En las apps (Capacitor) el User-Agent del WebView se ve igual que Chrome en
// Android; el juego manda su plataforma y aquí la mostramos como "navegador".
const appBrowser = (platform: unknown) =>
  platform === "android"
    ? { browser: "App Android" }
    : platform === "ios"
      ? { browser: "App iOS" }
      : {}

// Solo session_start lleva el contexto; pisa lo que haya mandado el cliente.
export function withDevice<
  T extends { type: string; data: Record<string, unknown> },
>(events: T[], headers: HeaderBag): T[] {
  const context = deviceContext(headers)
  return events.map((e) =>
    e.type === "session_start"
      ? {
          ...e,
          data: { ...e.data, ...context, ...appBrowser(e.data.platform) },
        }
      : e
  )
}
