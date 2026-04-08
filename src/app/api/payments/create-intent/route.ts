import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guard"

export async function POST(request: Request) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { bookingId } = await request.json()

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  })

  if (!booking || booking.customerId !== session!.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!booking.payment) {
    return NextResponse.json({ error: "No payment found" }, { status: 400 })
  }

  return NextResponse.json({
    clientSecret: booking.payment.stripePaymentIntentId,
  })
}
