import { NextRequest, NextResponse } from "next/server"
import { assertMcpOrAuthenticated } from "@/shared/lib/assert-mcp-or-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

export const runtime = "nodejs"

/** List canonical skills for typeahead when assigning skills to courses. */
export async function GET(request: NextRequest) {
  try {
    const auth = await assertMcpOrAuthenticated(request)
    if (!auth.ok) return auth.response

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("skills")
      .select("id, name")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ skills: data || [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list skills" },
      { status: 500 }
    )
  }
}
