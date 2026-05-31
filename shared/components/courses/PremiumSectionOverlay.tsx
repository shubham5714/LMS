"use client"

import Link from "next/link"
import React from "react"

type Props = {
  locked: boolean
  previewSrc?: string
  children: React.ReactNode
  /** Optional classes on the outer shell (e.g. `ratio ratio-16x9` for video, custom min-heights) */
  className?: string
  /**
   * When true, overlay is only a dark tint (no background image). Use when `children` already
   * include the same image so the gate sizes to the real media dimensions.
   */
  overlayTintOnly?: boolean
}

export function PremiumSectionOverlay({
  locked,
  previewSrc,
  children,
  className,
  overlayTintOnly = false,
}: Props) {
  if (!locked) {
    return <>{children}</>
  }

  const bgStyle: React.CSSProperties =
    overlayTintOnly || !previewSrc
      ? {
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.72) 100%)",
        }
      : {
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 100%), url(${previewSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }

  const shellClass = ["premium-section-wrap", "rounded-3", "overflow-hidden", className]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={shellClass}>
      <div className="premium-section-wrap__content premium-section-gated" aria-hidden="true">
        {children}
      </div>
      <div
        className="premium-section-wrap__overlay d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={bgStyle}
        role="region"
        aria-label="Premium content"
      >
        <Link
          scroll={false}
          href="/pages/pricing/"
          className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold shadow-sm"
          aria-label="Upgrade to Premium"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  )
}
