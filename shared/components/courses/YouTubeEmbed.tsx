"use client"

import { normalizeYoutubeEmbedUrl } from "@/shared/courses/youtube-embed-url"
import React, { useEffect, useId, useState } from "react"

type Props = {
  src: string
  title?: string
}

/**
 * YouTube iframe embed with a fixed 16:9 box so it does not collapse in BlockNote.
 */
export function YouTubeEmbed({ src, title = "YouTube video" }: Props) {
  const embedSrc = normalizeYoutubeEmbedUrl(src) || ""
  const reactId = useId()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [embedSrc])

  if (!embedSrc) {
    return (
      <div className="course-youtube-embed course-youtube-embed--missing">
        YouTube URL is missing or invalid.
      </div>
    )
  }

  return (
    <div className="course-youtube-embed" data-youtube-src={embedSrc}>
      <div
        className="course-youtube-embed__frame"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          minHeight: 280,
          background: "rgba(15, 23, 42, 0.65)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {failed ? (
          <div className="course-youtube-embed__fallback">
            <p>Could not load the YouTube video.</p>
            <a href={embedSrc} target="_blank" rel="noreferrer">
              Open on YouTube
            </a>
          </div>
        ) : (
          <iframe
            key={`${reactId}-${embedSrc}`}
            loading="lazy"
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setFailed(true)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: 0,
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
