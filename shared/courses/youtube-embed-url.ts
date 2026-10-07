/**
 * Normalize YouTube watch/share/embed URLs (or pasted embed HTML) to an iframe src.
 */

function extractYoutubeCandidate(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  const iframeSrc =
    text.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1] ||
    text.match(/\ssrc=["'](https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[^"']+)["']/i)?.[1]

  if (iframeSrc?.trim()) return iframeSrc.trim()

  const embeddedUrl = text.match(
    /https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/(?:watch\?[^\s"'<>]+|embed\/[^\s"'<>]+|shorts\/[^\s"'<>]+)|youtu\.be\/[^\s"'<>]+)/i
  )?.[0]
  if (embeddedUrl) return embeddedUrl.replace(/[.,);]+$/, "")

  if (/^https?:\/\//i.test(text)) return text

  return null
}

function extractVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase()

  if (host === "youtu.be" || host.endsWith(".youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0]
    return id || null
  }

  if (!host.includes("youtube.com") && !host.includes("youtube-nocookie.com")) {
    return null
  }

  const embedMatch = url.pathname.match(/\/embed\/([^/?#]+)/i)
  if (embedMatch?.[1]) return embedMatch[1]

  const shortsMatch = url.pathname.match(/\/shorts\/([^/?#]+)/i)
  if (shortsMatch?.[1]) return shortsMatch[1]

  const fromQuery = url.searchParams.get("v")
  if (fromQuery) return fromQuery

  return null
}

export function normalizeYoutubeEmbedUrl(input: string): string | null {
  const candidate = extractYoutubeCandidate(input)
  if (!candidate) return null

  try {
    const url = new URL(candidate)
    const id = extractVideoId(url)
    if (!id) return null

    const embed = new URL(
      `https://www.youtube.com/embed/${encodeURIComponent(id)}`
    )
    const start =
      url.searchParams.get("t") ||
      url.searchParams.get("start") ||
      url.searchParams.get("time_continue")
    if (start) {
      const seconds = start.endsWith("s")
        ? start.slice(0, -1)
        : /^\d+$/.test(start)
          ? start
          : null
      if (seconds) embed.searchParams.set("start", seconds)
    }

    return embed.toString()
  } catch {
    return null
  }
}

export function isYoutubeEmbedInput(input: string): boolean {
  return normalizeYoutubeEmbedUrl(input) != null
}

export function extractYoutubeEmbedFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    return normalizeYoutubeEmbedUrl(value)
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
    return normalizeYoutubeEmbedUrl(text)
  }
  return null
}
