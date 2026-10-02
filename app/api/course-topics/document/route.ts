import { NextRequest, NextResponse } from "next/server"
import { normalizeStorylaneEmbedUrl } from "@/shared/courses/storylane-embed-url"
import { assertAdminMembership } from "@/shared/lib/assert-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

type Body = {
  courseId?: string
  topicId?: string
  blocks?: unknown
}

type AnyBlock = {
  id?: string
  type?: string
  props?: Record<string, unknown>
  content?: unknown
  children?: AnyBlock[]
}

/** Ensure Storylane blocks persist a proper inline embed URL under demoUrl. */
function normalizeBlocksForSave(blocks: AnyBlock[]): AnyBlock[] {
  return blocks.map((block) => {
    if (block.type !== "storylaneEmbed") return block
    const raw =
      (typeof block.props?.demoUrl === "string" && block.props.demoUrl) ||
      (typeof block.props?.url === "string" && block.props.url) ||
      ""
    const demoUrl = normalizeStorylaneEmbedUrl(raw) || raw.trim()
    return {
      ...block,
      props: {
        ...block.props,
        demoUrl,
        title:
          (typeof block.props?.title === "string" && block.props.title) ||
          "Interactive demo",
      },
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await assertAdminMembership(user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only ADMIN membership can edit course content" },
        { status: 403 }
      )
    }

    const body = (await request.json()) as Body
    const courseId = body.courseId?.trim()
    const topicId = body.topicId?.trim()
    const blocks = body.blocks

    if (!courseId || !topicId) {
      return NextResponse.json(
        { error: "courseId and topicId are required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "blocks must be a JSON array" },
        { status: 400 }
      )
    }

    const normalizedBlocks = normalizeBlocksForSave(blocks as AnyBlock[])

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("course_topic_documents")
      .upsert(
        {
          course_id: courseId,
          topic_id: topicId,
          blocks: normalizedBlocks,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "course_id,topic_id" }
      )
      .select("course_id, topic_id, updated_at")
      .maybeSingle()

    if (error) {
      console.error("course_topic_documents upsert failed:", error)
      return NextResponse.json(
        { error: error.message || "Failed to save document" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, document: data })
  } catch (e) {
    console.error("course-topics/document POST:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}
