"use client"

import Link from "next/link"
import React from "react"

type Props = {
  locked: boolean
  children: React.ReactNode
  /** Optional classes on the lock panel shell */
  className?: string
  /** Stretch panel for full-topic gates */
  variant?: "section" | "topic"
}

export function PremiumSectionOverlay({
  locked,
  children,
  className,
  variant = "section",
}: Props) {
  if (!locked) {
    return <>{children}</>
  }

  const shellClass = [
    "premium-access-gate",
    variant === "topic" ? "premium-access-gate--topic" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={shellClass} role="region" aria-label="Premium content">
      <div className="premium-access-gate__inner">
        <div className="premium-access-gate__icon" aria-hidden>
          <i className="ri-lock-2-fill" />
        </div>
        <h3 className="premium-access-gate__title">
          Keep Going — Unlock the Full Lesson
        </h3>
        <p className="premium-access-gate__copy">
          You&apos;ve seen a preview. Join 25,000+ engineers with full access to
          every lesson, hands-on project, and video walkthrough
        </p>
        <Link
          scroll={false}
          href="/pages/pricing/"
          className="premium-access-gate__cta"
        >
          Get Full Access
        </Link>
      </div>
    </div>
  )
}
