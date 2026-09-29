/** Server + client plan catalog for Razorpay checkout (amounts in paise). */

export type SubscriptionPlanId = "monthly" | "yearly"

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  /** Amount in paise (₹1 = 100 paise). Minimum Razorpay amount is 100. */
  amountPaise: number
  currency: "INR"
  /** Human-readable price label */
  priceLabel: string
  cadenceLabel: string
  note: string
  description: string
  /** Subscription length added on successful payment */
  durationDays: number
  /** Value written to user_memberships.membership */
  membershipValue: string
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  monthly: {
    id: "monthly",
    name: "Pro Monthly",
    amountPaise: 99900, // ₹999.00
    currency: "INR",
    priceLabel: "₹999",
    cadenceLabel: "/month",
    note: "Billed monthly · cancel anytime",
    description:
      "Everything unlocked, billed month to month. Start today and pay as you go.",
    durationDays: 30,
    membershipValue: "PREMIUM",
    popular: false,
  },
  yearly: {
    id: "yearly",
    name: "Pro Yearly",
    amountPaise: 799900, // ₹7999.00
    currency: "INR",
    priceLabel: "₹7999",
    cadenceLabel: "/year",
    note: "Best value · billed once a year",
    description:
      "One plan for the year — less than a coffee a day to change your SOC career.",
    durationDays: 365,
    membershipValue: "PREMIUM",
    popular: true,
  },
}

export const SUBSCRIPTION_PLAN_LIST: SubscriptionPlan[] = [
  SUBSCRIPTION_PLANS.monthly,
  SUBSCRIPTION_PLANS.yearly,
]

export function getSubscriptionPlan(
  planId: string | null | undefined
): SubscriptionPlan | null {
  if (planId === "monthly" || planId === "yearly") {
    return SUBSCRIPTION_PLANS[planId]
  }
  return null
}

export function addSubscriptionDays(from: Date, days: number): Date {
  const next = new Date(from.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}
