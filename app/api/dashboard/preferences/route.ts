import { NextRequest, NextResponse } from "next/server"
import { getTrackById } from "@/shared/courses/tracks"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_dashboard_preferences")
      .select("selected_track_id, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      selectedTrackId: data?.selected_track_id ?? null,
      updatedAt: data?.updated_at ?? null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}

type PutBody = {
  selectedTrackId?: string
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as PutBody
    const selectedTrackId = body.selectedTrackId?.trim()
    if (!selectedTrackId) {
      return NextResponse.json(
        { error: "selectedTrackId is required" },
        { status: 400 }
      )
    }

    const track = getTrackById(selectedTrackId)
    if (!track || track.kind !== "career") {
      return NextResponse.json(
        { error: "selectedTrackId must be a career track" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("user_dashboard_preferences")
      .upsert(
        {
          user_id: user.id,
          selected_track_id: selectedTrackId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("selected_track_id, updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      selectedTrackId: data.selected_track_id,
      updatedAt: data.updated_at,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}
