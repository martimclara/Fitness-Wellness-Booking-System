import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"

export async function GET() {
  const { error, session } = await requireRole("TRAINER")
  if (error) return error

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!trainerProfile) {
    return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 })
  }

  const bookings = await prisma.booking.findMany({
    where: { trainerProfileId: trainerProfile.id },
    include: {
      customer: { select: { name: true, email: true } },
      service: { select: { name: true, type: true, price: true, durationMinutes: true } },
    },
    orderBy: { startTime: "desc" },
  })

  return NextResponse.json(bookings)
}
