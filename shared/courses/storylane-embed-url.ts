/**
 * Normalize Storylane share/demo URLs (or pasted embed HTML) to an inline iframe src.
 */

function extractStorylaneCandidate(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  // Prefer iframe src (embed HTML often also has <script src="…storylane.js">)
  const iframeSrc =
    text.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1] ||
    text.match(/class=["'][^"']*sl-demo[^"']*["'][^>]*\ssrc=["']([^"']+)["']/i)?.[1]

  if (iframeSrc?.trim()) return iframeSrc.trim()

  // Any storylane demo/share URL appearing in the paste
  const embeddedUrl = text.match(
    /https?:\/\/(?:app\.|demo\.)?storylane\.(?:io|com)\/(?:demo|share)\/[^\s"'<>]+/i
  )?.[0]
  if (embeddedUrl) return embeddedUrl.replace(/[.,);]+$/, "")

  // Plain URL paste
  if (/^https?:\/\//i.test(text)) return text

  return null
}

export function normalizeStorylaneEmbedUrl(input: string): string | null {
  const candidate = extractStorylaneCandidate(input)
  if (!candidate) return null

  try {
    const url = new URL(candidate)
    const host = url.hostname.toLowerCase()
    if (!host.includes("storylane")) return null

    const shareMatch = url.pathname.match(/\/share\/([^/?#]+)/i)
    const demoMatch = url.pathname.match(/\/demo\/([^/?#]+)/i)
    const id = shareMatch?.[1] || demoMatch?.[1]
    if (!id) return null

    return `https://app.storylane.io/demo/${encodeURIComponent(id)}?embed=inline`
  } catch {
    return null
  }
}

export function isStorylaneEmbedInput(input: string): boolean {
  return normalizeStorylaneEmbedUrl(input) != null
}

export function extractStorylaneEmbedFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    return normalizeStorylaneEmbedUrl(value)
  }
  if (Array.isArray(value)) {
    const text = value
      .map((n) => {
        if (typeof n === "string") return n
        if (n && typeof n === "object" && "text" in n) {
          return String((n as { text?: string }).text ?? "")
        }
        return ""
      })
      .join("")
    return normalizeStorylaneEmbedUrl(text)
  }
  return null
}
