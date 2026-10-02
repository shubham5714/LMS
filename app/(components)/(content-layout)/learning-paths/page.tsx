"use client"

import { useRouter } from "next/navigation"
import React, { useEffect } from "react"

/** Legacy route — redirects to /tracks */
export default function LearningPathsRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/tracks")
  }, [router])
  return <p className="text-muted">Redirecting to Tracks…</p>
}
