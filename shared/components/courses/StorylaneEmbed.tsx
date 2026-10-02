"use client"

import { normalizeStorylaneEmbedUrl } from "@/shared/courses/storylane-embed-url"
import React, { useEffect, useId, useState } from "react"

const STORYLANE_SCRIPT_SRC = "https://js.storylane.io/js/v2/storylane.js"

type Props = {
  src: string
  title?: string
}

function ensureStorylaneScript() {
  if (typeof document === "undefined") return
  const existing = document.querySelector(
    `script[data-storylane-embed="true"]`
  )
  if (existing) return
  const script = document.createElement("script")
  script.src = STORYLANE_SCRIPT_SRC
  script.async = true
  script.dataset.storylaneEmbed = "true"
  document.body.appendChild(script)
}

/**
 * Official Storylane inline embed (iframe + their script).
 * Uses a real height so it does not collapse inside BlockNote.
 */
export function StorylaneEmbed({ src, title = "Interactive demo" }: Props) {
  const embedSrc = normalizeStorylaneEmbedUrl(src) || ""
  const reactId = useId()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    ensureStorylaneScript()
  }, [])

  useEffect(() => {
    setFailed(false)
  }, [embedSrc])

  if (!embedSrc) {
    return (
      <div className="course-storylane-embed course-storylane-embed--missing">
        Storylane demo URL is missing or invalid.
      </div>
    )
  }

  return (
    <div className="course-storylane-embed" data-storylane-src={embedSrc}>
      <div
        className="sl-embed"
        style={{
          position: "relative",
          width: "100%",
          // Fixed aspect box — padding-% height:0 often collapses inside BlockNote
          aspectRatio: "16 / 9",
          minHeight: 360,
          transform: "scale(1)",
          background: "rgba(15, 23, 42, 0.65)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {failed ? (
          <div className="course-storylane-embed__fallback">
            <p>Could not load the Storylane preview.</p>
            <a href={embedSrc} target="_blank" rel="noreferrer">
              Open demo in a new tab
            </a>
          </div>
        ) : (
          <iframe
            key={`${reactId}-${embedSrc}`}
            loading="lazy"
            className="sl-demo"
            src={embedSrc}
            title={title}
            tabIndex={-1}
            allow="fullscreen; clipboard-write"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setFailed(true)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "1px solid rgba(63, 95, 172, 0.35)",
              borderRadius: "10px",
              boxSizing: "border-box",
              background: "#0b1220",
            }}
          />
        )}
      </div>
    </div>
  )
}
