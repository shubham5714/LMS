declare module "razorpay" {
  interface RazorpayOrderCreateRequest {
    amount: number | string
    currency: string
    receipt?: string
    notes?: Record<string, string | number>
  }

  interface RazorpayOrder {
    id: string
    amount: number | string
    currency: string
    receipt?: string
    status?: string
  }

  interface RazorpayOrders {
    create: (options: RazorpayOrderCreateRequest) => Promise<RazorpayOrder>
  }

  class Razorpay {
    constructor(options: { key_id: string; key_secret: string })
    orders: RazorpayOrders
  }

  export default Razorpay
}
