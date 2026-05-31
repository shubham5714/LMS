"use client"

import { useEffect, useState } from "react"

/** Scroll progress through the document (0–100). */
export function useReadingProgress() {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrollable = el.scrollHeight - window.innerHeight
      if (scrollable <= 0) {
        setPercent(100)
        return
      }
      const p = Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)))
      setPercent(p)
    }

    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return percent
}
