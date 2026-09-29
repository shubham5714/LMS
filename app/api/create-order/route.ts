import { NextRequest, NextResponse } from "next/server"
import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/shared/data/pricing/subscription-plans"
import { getRazorpayClient, getRazorpayKeyId } from "@/shared/lib/razorpay"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

type CreateOrderBody = {
  planId?: SubscriptionPlanId
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
        { error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      )
    }

    const body = (await request.json()) as CreateOrderBody
    const plan = getSubscriptionPlan(body.planId)

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan. Choose monthly or yearly." },
        { status: 400 }
      )
    }

    if (plan.amountPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise." },
        { status: 400 }
      )
    }

    const receipt = `sub_${plan.id}_${user.id.slice(0, 8)}_${Date.now()}`
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 40)

    const razorpay = getRazorpayClient()
    const order = await razorpay.orders.create({
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt,
      notes: {
        user_id: user.id,
        plan_id: plan.id,
        membership: plan.membershipValue,
      },
    })

    try {
      const admin = createSupabaseAdminClient()
      const { error: insertError } = await admin.from("payment_orders").insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: plan.amountPaise,
        currency: plan.currency,
        plan: plan.id,
        status: "created",
        receipt,
      })

      if (insertError) {
        console.error("payment_orders insert failed:", insertError)
        return NextResponse.json(
          {
            error:
              "Could not record order. Run the subscription SQL migration, then retry.",
            details: insertError.message,
          },
          { status: 500 }
        )
      }
    } catch (adminError) {
      console.error("Supabase admin error:", adminError)
      return NextResponse.json(
        {
          error:
            "Missing SUPABASE_SERVICE_ROLE_KEY or payment_orders table. See migration SQL.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getRazorpayKeyId(),
      plan_id: plan.id,
      plan_name: plan.name,
    })
  } catch (error) {
    console.error("create-order error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to create order"
    const status = /auth|key|secret|unauthorized/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
