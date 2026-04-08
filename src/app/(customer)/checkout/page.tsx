"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { CheckoutForm } from "@/components/features/payment/checkout-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

function CheckoutContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")
  const clientSecret = searchParams.get("clientSecret")

  if (!bookingId || !clientSecret) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Invalid checkout session.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Complete Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <CheckoutForm bookingId={bookingId} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 rounded-lg bg-muted animate-pulse max-w-lg mx-auto" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
