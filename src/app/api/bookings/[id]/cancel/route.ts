import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-guard"
import { cancelBooking } from "@/lib/booking-service"
import { cancelBookingSchema } from "@/lib/validators"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = cancelBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await cancelBooking(id, session!.user.id, parsed.data.reason)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed"
    const status = message === "Unauthorized" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
