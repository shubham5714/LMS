/** True when user should see full course content (anything other than FREE). */
export function hasPaidMembership(membership: string | null | undefined): boolean {
  if (membership == null || membership === "") return false
  const normalized = membership.trim().toUpperCase()
  // ADMIN ops accounts always have paid access (expiry ignored upstream).
  if (normalized === "ADMIN") return true
  return normalized !== "FREE"
}

/** Content editors: user_memberships.membership === ADMIN (case-insensitive). */
export function isContentEditor(membership: string | null | undefined): boolean {
  if (membership == null || membership === "") return false
  return membership.trim().toUpperCase() === "ADMIN"
}

/**
 * Effective membership for UI.
 * ADMIN is never downgraded by expires_at so ops accounts stay editable/paid.
 */
export function effectiveMembership(
  membership: string | null | undefined,
  expiresAt?: string | null
): string | null {
  if (membership == null || membership === "") return null
  const normalized = membership.trim()
  if (normalized.toUpperCase() === "ADMIN") return normalized

  if (expiresAt) {
    const exp = new Date(expiresAt)
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return "FREE"
    }
  }
  return normalized
}
