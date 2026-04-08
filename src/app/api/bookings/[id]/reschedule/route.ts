import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-guard"
import { rescheduleBooking } from "@/lib/booking-service"
import { rescheduleBookingSchema } from "@/lib/validators"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = rescheduleBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    await rescheduleBooking(id, session!.user.id, parsed.data.date, parsed.data.time)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reschedule failed"
    const status = message === "Unauthorized" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
