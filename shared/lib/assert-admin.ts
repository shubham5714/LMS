import { isContentEditor } from "@/shared/courses/membership-roles"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

export async function assertAdminMembership(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("user_memberships")
    .select("membership")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("ADMIN membership check failed:", error)
    return false
  }

  return isContentEditor(data?.membership)
}
