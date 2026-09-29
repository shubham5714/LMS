"use client"

import React, { useCallback, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons"
import {
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from "@/shared/data/pricing/subscription-plans"
import {
  useUpdateMembership,
  type UserMembershipRow,
} from "@/shared/contextapi/MembershipContext"
import { supabase } from "@/shared/lib/supabase"
import type {
  RazorpayCheckoutFailure,
  RazorpayCheckoutSuccess,
} from "@/shared/types/razorpay"

type Props = {
  plan: SubscriptionPlan
  className?: string
  buttonVariant?: string
  label?: string
}

type CreateOrderResponse = {
  order_id: string
  amount: number
  currency: string
  key_id: string
  plan_id: SubscriptionPlanId
  plan_name: string
  error?: string
}

type VerifyResponse = {
  success?: boolean
  membership?: UserMembershipRow
  expires_at?: string
  error?: string
}

export function RazorpayCheckoutButton({
  plan,
  className = "d-grid w-100 btn-wave",
  buttonVariant = "primary",
  label,
}: Props) {
  const router = useRouter()
  const applyMembership = useUpdateMembership()
  const [scriptReady, setScriptReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const verifyPayment = useCallback(
    async (payload: RazorpayCheckoutSuccess) => {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          planId: plan.id,
        }),
      })
      const data = (await res.json()) as VerifyResponse

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed")
      }

      if (data.membership) {
        applyMembership(data.membership)
      }

      toast.success(
        data.expires_at
          ? `Premium activated until ${new Date(data.expires_at).toLocaleDateString()}`
          : "Premium activated successfully"
      )
      router.push("/dashboard")
    },
    [applyMembership, plan.id, router]
  )

  const startCheckout = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.info("Please sign in to purchase Premium")
        router.push(`/signin?redirectedFrom=${encodeURIComponent("/pages/pricing/")}`)
        return
      }

      if (!scriptReady || typeof window.Razorpay !== "function") {
        toast.error("Payment gateway is still loading. Try again in a moment.")
        return
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      })
      const orderData = (await orderRes.json()) as CreateOrderResponse

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Could not create payment order")
      }

      const rzp = new window.Razorpay!({
        key: orderData.key_id,
        amount: Number(orderData.amount),
        currency: orderData.currency,
        name: "Cyber Docs",
        description: orderData.plan_name || plan.name,
        order_id: orderData.order_id,
        handler: async (response: RazorpayCheckoutSuccess) => {
          try {
            await verifyPayment(response)
          } catch (err) {
            console.error(err)
            toast.error(
              err instanceof Error ? err.message : "Could not activate subscription"
            )
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          email: user.email || undefined,
          name:
            (user.user_metadata?.username as string | undefined) ||
            user.email?.split("@")[0],
        },
        notes: {
          plan_id: plan.id,
          user_id: user.id,
        },
        theme: { color: "#5c67f7" },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast.info("Payment cancelled")
          },
        },
      })

      rzp.on("payment.failed", (response: RazorpayCheckoutFailure) => {
        console.error("Razorpay payment failed:", response)
        setLoading(false)
        toast.error(
          response.error?.description ||
            response.error?.reason ||
            "Payment failed. Please try again."
        )
      })

      rzp.open()
    } catch (err) {
      console.error(err)
      setLoading(false)
      toast.error(err instanceof Error ? err.message : "Checkout failed")
    }
  }, [loading, plan, router, scriptReady, verifyPayment])

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <SpkButton
        Buttonvariant={buttonVariant}
        Buttontype="button"
        Size="lg"
        Customclass={className}
        Disabled={loading}
        onClickfunc={startCheckout}
      >
        <span className="ms-4 me-4">
          {loading ? "Processing…" : label || `Get ${plan.name}`}
        </span>
      </SpkButton>
    </>
  )
}
