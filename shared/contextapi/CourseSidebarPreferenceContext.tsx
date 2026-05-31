"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import { SOC_FUNDAMENTALS_ROUTE_PREFIX } from "@/shared/courses/soc-fundamentals-config"

export { SOC_FUNDAMENTALS_ROUTE_PREFIX }

function isSocFundamentalsHref(path?: string): boolean {
  if (!path) return false
  return path === SOC_FUNDAMENTALS_ROUTE_PREFIX || path.startsWith(`${SOC_FUNDAMENTALS_ROUTE_PREFIX}/`)
}

function pathsMatch(pathname: string, href: string): boolean {
  const norm = (p: string) => p.replace(/\/$/, "") || "/"
  return norm(pathname) === norm(href)
}

/** Main menu: open course sidebar; on same URL use preventDefault so Next.js still updates UI. */
export function handleSocFundamentalsMenuLinkClick(
  e: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string | undefined,
  preferCourseSidebarNav: (() => void) | null | undefined
) {
  if (!href || !isSocFundamentalsHref(href) || !preferCourseSidebarNav) return
  preferCourseSidebarNav()
  if (pathsMatch(pathname, href)) e.preventDefault()
}

type CourseSidebarPreferenceContextValue = {
  preferMainAppNav: boolean
  setPreferMainAppNav: (value: boolean) => void
  preferCourseSidebarNav: () => void
}

const CourseSidebarPreferenceContext = createContext<CourseSidebarPreferenceContextValue | null>(null)

export function CourseSidebarPreferenceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isSocRoute = pathname.startsWith(SOC_FUNDAMENTALS_ROUTE_PREFIX)
  const [preferMainAppNav, setPreferMainAppNav] = useState(false)

  useEffect(() => {
    if (!isSocRoute) setPreferMainAppNav(false)
  }, [isSocRoute])

  const preferCourseSidebarNav = useCallback(() => setPreferMainAppNav(false), [])

  const value = useMemo(
    () => ({
      preferMainAppNav,
      setPreferMainAppNav,
      preferCourseSidebarNav,
    }),
    [preferMainAppNav, preferCourseSidebarNav]
  )

  return (
    <CourseSidebarPreferenceContext.Provider value={value}>
      {children}
    </CourseSidebarPreferenceContext.Provider>
  )
}

export function useCourseSidebarPreference() {
  return useContext(CourseSidebarPreferenceContext)
}
