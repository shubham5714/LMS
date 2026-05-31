"use client"

import { useEffect, useState } from "react"

/**
 * Tracks which section id is “current” based on scroll position (section nearest top offset).
 */
export function useActiveOutlineSection(sectionIds: readonly string[], topOffset = 100) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "")

  useEffect(() => {
    if (sectionIds.length === 0) return

    const compute = () => {
      let current = sectionIds[0]
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= topOffset) current = id
      }
      setActiveId(current)
    }

    window.addEventListener("scroll", compute, { passive: true })
    window.addEventListener("resize", compute, { passive: true })
    compute()
    return () => {
      window.removeEventListener("scroll", compute)
      window.removeEventListener("resize", compute)
    }
  }, [sectionIds, topOffset])

  return activeId
}
