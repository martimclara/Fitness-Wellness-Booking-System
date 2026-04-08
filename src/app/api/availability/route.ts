import { NextRequest, NextResponse } from "next/server"
import { getAvailableSlots } from "@/lib/availability"
import { availabilityQuerySchema } from "@/lib/validators"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const parsed = availabilityQuerySchema.safeParse({
    trainerId: searchParams.get("trainerId"),
    serviceId: searchParams.get("serviceId"),
    date: searchParams.get("date"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const slots = await getAvailableSlots(
    parsed.data.trainerId,
    parsed.data.serviceId,
    parsed.data.date
  )

  return NextResponse.json({ slots, date: parsed.data.date })
}
