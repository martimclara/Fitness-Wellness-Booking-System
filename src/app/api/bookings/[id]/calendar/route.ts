import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guard"
import { generateIcs } from "@/lib/calendar-export"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      trainerProfile: { include: { user: { select: { name: true } } } },
    },
  })

  if (!booking || booking.customerId !== session!.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ics = generateIcs(booking)

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${id}.ics"`,
    },
  })
}
