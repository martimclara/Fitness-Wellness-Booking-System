import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { confirmBooking } from "@/lib/booking-service"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "payment_intent.amount_capturable_updated": {
      const paymentIntent = event.data.object
      await confirmBooking(paymentIntent.id)
      break
    }
    case "payment_intent.payment_failed": {
      // Payment failed — booking stays PENDING_PAYMENT and will be cleaned up by cron
      console.log("Payment failed:", event.data.object.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
