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

import { isCourseHref, isCourseRoutePathname } from "@/shared/courses/course-routes"
import { SOC_FUNDAMENTALS_ROUTE_PREFIX } from "@/shared/courses/soc-fundamentals-config"

export { SOC_FUNDAMENTALS_ROUTE_PREFIX }

function pathsMatch(pathname: string, href: string): boolean {
  const norm = (p: string) => p.replace(/\/$/, "") || "/"
  return norm(pathname) === norm(href)
}

/** Main menu: open course sidebar; on same URL use preventDefault so Next.js still updates UI. */
export function handleCourseMenuLinkClick(
  e: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string | undefined,
  preferCourseSidebarNav: (() => void) | null | undefined
) {
  if (!href || !isCourseHref(href) || !preferCourseSidebarNav) return
  preferCourseSidebarNav()
  if (pathsMatch(pathname, href)) e.preventDefault()
}

/** @deprecated Use handleCourseMenuLinkClick */
export const handleSocFundamentalsMenuLinkClick = handleCourseMenuLinkClick

type CourseSidebarPreferenceContextValue = {
  preferMainAppNav: boolean
  setPreferMainAppNav: (value: boolean) => void
  preferCourseSidebarNav: () => void
}

const CourseSidebarPreferenceContext = createContext<CourseSidebarPreferenceContextValue | null>(null)

export function CourseSidebarPreferenceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isCourseRoute = isCourseRoutePathname(pathname)
  const [preferMainAppNav, setPreferMainAppNav] = useState(false)

  useEffect(() => {
    if (!isCourseRoute) setPreferMainAppNav(false)
  }, [isCourseRoute])

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
