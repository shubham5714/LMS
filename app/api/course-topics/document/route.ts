import { NextRequest, NextResponse } from "next/server"
import { validateFreeBlockNoteBlocks } from "@/shared/courses/blocknote-blocks-schema"
import { normalizeStorylaneEmbedUrl } from "@/shared/courses/storylane-embed-url"
import { normalizeYoutubeEmbedUrl } from "@/shared/courses/youtube-embed-url"
import {
  assertMcpOrAdmin,
  assertMcpOrAuthenticated,
} from "@/shared/lib/assert-mcp-or-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

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

/** Ensure embed blocks persist a proper iframe src. */
function normalizeBlocksForSave(blocks: AnyBlock[]): AnyBlock[] {
  return blocks.map((block) => {
    if (block.type === "storylaneEmbed") {
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
    }

    if (block.type === "youtubeEmbed") {
      const raw =
        (typeof block.props?.videoUrl === "string" && block.props.videoUrl) ||
        (typeof block.props?.url === "string" && block.props.url) ||
        ""
      const videoUrl = normalizeYoutubeEmbedUrl(raw) || raw.trim()
      return {
        ...block,
        props: {
          ...block.props,
          videoUrl,
          title:
            (typeof block.props?.title === "string" && block.props.title) ||
            "YouTube video",
        },
      }
    }

    // Convert YouTube URLs accidentally saved on the default video block.
    if (block.type === "video") {
      const raw =
        (typeof block.props?.url === "string" && block.props.url) || ""
      const videoUrl = normalizeYoutubeEmbedUrl(raw)
      if (videoUrl) {
        return {
          ...block,
          type: "youtubeEmbed",
          props: {
            videoUrl,
            title:
              (typeof block.props?.caption === "string" &&
                block.props.caption.trim()) ||
              "YouTube video",
          },
        }
      }
    }

    return block
  })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await assertMcpOrAuthenticated(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")?.trim()
    const topicId = searchParams.get("topicId")?.trim()

    if (!courseId || !topicId) {
      return NextResponse.json(
        { error: "courseId and topicId query params are required" },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("course_topic_documents")
      .select("course_id, topic_id, blocks, updated_at, updated_by")
      .eq("course_id", courseId)
      .eq("topic_id", topicId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ document: data })
  } catch (e) {
    console.error("course-topics/document GET:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

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

    // MCP/AI path: free blocks only. Admin UI may still save premium markers.
    if (auth.viaMcp) {
      const validation = validateFreeBlockNoteBlocks(blocks)
      if (!validation.ok) {
        return NextResponse.json(
          {
            error: "Invalid free BlockNote document",
            issues: validation.issues,
          },
          { status: 400 }
        )
      }
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
          updated_by: auth.userId,
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
