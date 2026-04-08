import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guard"
import { createBooking } from "@/lib/booking-service"
import { createBookingSchema } from "@/lib/validators"

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const bookings = await prisma.booking.findMany({
    where: { customerId: session!.user.id },
    include: {
      service: true,
      trainerProfile: { include: { user: { select: { name: true, image: true } } } },
      payment: true,
    },
    orderBy: { startTime: "desc" },
  })

  return NextResponse.json(bookings)
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const parsed = createBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await createBooking(
      session!.user.id,
      parsed.data.trainerId,
      parsed.data.serviceId,
      parsed.data.date,
      parsed.data.time,
      parsed.data.notes
    )

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
