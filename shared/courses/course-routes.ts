export function isCourseRoutePathname(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/"
  if (normalized === "/courses" || normalized === "/courses/manage") return false
  return normalized.startsWith("/courses/")
}

export function isCourseHref(href?: string): boolean {
  if (!href) return false
  return isCourseRoutePathname(href)
}
