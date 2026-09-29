export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpayCheckoutFailure = {
  error: {
    code?: string
    description?: string
    source?: string
    step?: string
    reason?: string
    metadata?: Record<string, unknown>
  }
}

export type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name?: string
  description?: string
  image?: string
  order_id: string
  handler: (response: RazorpayCheckoutSuccess) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: { color?: string }
  modal?: {
    ondismiss?: () => void
  }
}

export type RazorpayInstance = {
  open: () => void
  on: (
    event: "payment.failed",
    handler: (response: RazorpayCheckoutFailure) => void
  ) => void
}

export type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions
) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

export {}
