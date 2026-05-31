import { SECURONIX_SIEM_ROUTE_PREFIX } from "@/shared/courses/securonix-siem-config"
import { SOC_FUNDAMENTALS_ROUTE_PREFIX } from "@/shared/courses/soc-fundamentals-config"

export const COURSE_ROUTE_PREFIXES = [
  SOC_FUNDAMENTALS_ROUTE_PREFIX,
  SECURONIX_SIEM_ROUTE_PREFIX,
] as const

export function isCourseRoutePathname(pathname: string): boolean {
  return COURSE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isCourseHref(href?: string): boolean {
  if (!href) return false
  return COURSE_ROUTE_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`)
  )
}
