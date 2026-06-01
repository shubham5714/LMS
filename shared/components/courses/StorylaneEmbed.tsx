"use client"

import Script from "next/script"
import React from "react"

const STORYLANE_SCRIPT_SRC = "https://js.storylane.io/js/v2/storylane.js"

type Props = {
  src: string
  title?: string
}

export function StorylaneEmbed({ src, title = "Interactive demo" }: Props) {
  return (
    <div className="course-storylane-embed mt-3">
      <Script src={STORYLANE_SCRIPT_SRC} strategy="lazyOnload" />
      <div
        className="sl-embed"
        style={{
          position: "relative",
          paddingBottom: "calc(43.08% + 25px)",
          width: "100%",
          height: 0,
          transform: "scale(1)",
        }}
      >
        <iframe
          loading="lazy"
          className="sl-demo"
          src={src}
          name="sl-embed"
          title={title}
          allow="fullscreen"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "1px solid rgba(63, 95, 172, 0.35)",
            boxShadow: "0px 0px 18px rgba(26, 19, 72, 0.15)",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  )
}
