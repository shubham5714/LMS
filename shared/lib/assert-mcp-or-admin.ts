import { NextRequest, NextResponse } from "next/server"
import { assertAdminMembership } from "@/shared/lib/assert-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export type McpOrAdminAuth =
  | {
      ok: true
      /** MCP service token (no browser session). */
      viaMcp: true
      /** Actor UUID for updated_by, or null if LMS_MCP_ACTOR_USER_ID unset. */
      userId: string | null
    }
  | {
      ok: true
      viaMcp: false
      userId: string
    }
  | {
      ok: false
      response: NextResponse
    }

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() || null
}

function mcpTokenConfigured(): string | null {
  const token = process.env.LMS_MCP_TOKEN?.trim()
  return token || null
}

function mcpActorUserId(): string | null {
  const id = process.env.LMS_MCP_ACTOR_USER_ID?.trim()
  return id || null
}

/** True when Authorization Bearer matches LMS_MCP_TOKEN. */
export function isMcpBearerAuthorized(request: NextRequest): boolean {
  const expected = mcpTokenConfigured()
  if (!expected) return false
  const provided = extractBearerToken(request)
  return Boolean(provided && provided === expected)
}

/**
 * Authorize course content APIs via MCP service token or cookie ADMIN session.
 * Prefer MCP token when present and valid (Horizon / local FastMCP).
 */
export async function assertMcpOrAdmin(
  request: NextRequest
): Promise<McpOrAdminAuth> {
  if (isMcpBearerAuthorized(request)) {
    return {
      ok: true,
      viaMcp: true,
      userId: mcpActorUserId(),
    }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!(await assertAdminMembership(user.id))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "ADMIN only" }, { status: 403 }),
    }
  }

  return { ok: true, viaMcp: false, userId: user.id }
}

/**
 * Read access: MCP token (full catalog) or any authenticated user.
 * When via MCP, treats caller as admin for unpublished visibility.
 */
export async function assertMcpOrAuthenticated(
  request: NextRequest
): Promise<
  | { ok: true; viaMcp: boolean; userId: string | null; isAdmin: boolean }
  | { ok: false; response: NextResponse }
> {
  if (isMcpBearerAuthorized(request)) {
    return {
      ok: true,
      viaMcp: true,
      userId: mcpActorUserId(),
      isAdmin: true,
    }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const isAdmin = await assertAdminMembership(user.id)
  return { ok: true, viaMcp: false, userId: user.id, isAdmin }
}
