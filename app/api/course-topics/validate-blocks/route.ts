import { NextRequest, NextResponse } from "next/server"
import {
  FREE_BLOCK_TYPES,
  validateFreeBlockNoteBlocks,
} from "@/shared/courses/blocknote-blocks-schema"
import { assertMcpOrAdmin } from "@/shared/lib/assert-mcp-or-admin"

export const runtime = "nodejs"

type Body = {
  blocks?: unknown
}

/**
 * Dry-run validation for free BlockNote documents (MCP / AI authoring).
 * Does not write to the database.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as Body
    const result = validateFreeBlockNoteBlocks(body.blocks)

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          issues: result.issues,
          allowedTypes: FREE_BLOCK_TYPES,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      blockCount: result.blocks.length,
      allowedTypes: FREE_BLOCK_TYPES,
    })
  } catch (e) {
    console.error("validate-blocks POST:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}
