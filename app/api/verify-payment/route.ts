import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import {
  addSubscriptionDays,
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/shared/data/pricing/subscription-plans"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

type VerifyPaymentBody = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  planId?: SubscriptionPlanId
}

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured")
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signature)

  if (expectedBuf.length !== actualBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    }

    const body = (await request.json()) as VerifyPaymentBody
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      planId,
    } = body

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error:
            "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature.",
        },
        { status: 400 }
      )
    }

    if (!verifySignature(orderId, paymentId, signature)) {
      return NextResponse.json(
        { success: false, error: "Payment signature mismatch." },
        { status: 400 }
      )
    }

    let admin
    try {
      admin = createSupabaseAdminClient()
    } catch {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY on the server." },
        { status: 500 }
      )
    }

    const { data: orderRow, error: orderError } = await admin
      .from("payment_orders")
      .select("id, user_id, plan, status, amount, currency")
      .eq("razorpay_order_id", orderId)
      .maybeSingle()

    if (orderError) {
      console.error("payment_orders lookup failed:", orderError)
      return NextResponse.json(
        { error: "Could not look up payment order.", details: orderError.message },
        { status: 500 }
      )
    }

    if (!orderRow) {
      return NextResponse.json(
        { error: "Unknown order. Create the order through this app first." },
        { status: 400 }
      )
    }

    if (orderRow.user_id !== user.id) {
      return NextResponse.json(
        { error: "This order does not belong to the signed-in user." },
        { status: 403 }
      )
    }

    const resolvedPlanId = (planId || orderRow.plan) as SubscriptionPlanId
    const plan = getSubscriptionPlan(resolvedPlanId)

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan on order." }, { status: 400 })
    }

    // Idempotent: already paid → return current membership
    if (orderRow.status === "paid") {
      const { data: existing } = await admin
        .from("user_memberships")
        .select(
          "id, user_id, username, membership, plan, expires_at, subscription_started_at, created_at"
        )
        .eq("user_id", user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        membership: existing,
      })
    }

    const now = new Date()
    const { data: currentMembership } = await admin
      .from("user_memberships")
      .select("id, expires_at, membership")
      .eq("user_id", user.id)
      .maybeSingle()

    let baseDate = now
    if (currentMembership?.expires_at) {
      const existingExpiry = new Date(currentMembership.expires_at)
      if (
        !Number.isNaN(existingExpiry.getTime()) &&
        existingExpiry.getTime() > now.getTime()
      ) {
        baseDate = existingExpiry
      }
    }

    const expiresAt = addSubscriptionDays(baseDate, plan.durationDays)

    const { error: orderUpdateError } = await admin
      .from("payment_orders")
      .update({
        status: "paid",
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        paid_at: now.toISOString(),
      })
      .eq("id", orderRow.id)
      .eq("status", "created")

    if (orderUpdateError) {
      console.error("payment_orders update failed:", orderUpdateError)
      return NextResponse.json(
        {
          error: "Payment verified but order update failed.",
          details: orderUpdateError.message,
        },
        { status: 500 }
      )
    }

    const membershipPayload = {
      membership: plan.membershipValue,
      plan: plan.id,
      subscription_started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_razorpay_payment_id: paymentId,
      last_razorpay_order_id: orderId,
    }

    let membershipRow

    if (currentMembership?.id) {
      const { data, error } = await admin
        .from("user_memberships")
        .update(membershipPayload)
        .eq("user_id", user.id)
        .select(
          "id, user_id, username, membership, plan, expires_at, subscription_started_at, created_at"
        )
        .single()

      if (error) {
        console.error("user_memberships update failed:", error)
        return NextResponse.json(
          {
            error:
              "Payment verified but membership update failed. Run the subscription SQL migration.",
            details: error.message,
          },
          { status: 500 }
        )
      }
      membershipRow = data
    } else {
      const { data, error } = await admin
        .from("user_memberships")
        .insert({
          user_id: user.id,
          username:
            user.user_metadata?.username ||
            user.email?.split("@")[0] ||
            "member",
          ...membershipPayload,
        })
        .select(
          "id, user_id, username, membership, plan, expires_at, subscription_started_at, created_at"
        )
        .single()

      if (error) {
        console.error("user_memberships insert failed:", error)
        return NextResponse.json(
          {
            error: "Payment verified but membership create failed.",
            details: error.message,
          },
          { status: 500 }
        )
      }
      membershipRow = data
    }

    return NextResponse.json({
      success: true,
      membership: membershipRow,
      plan: plan.id,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("verify-payment error:", error)
    const message =
      error instanceof Error ? error.message : "Payment verification failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
