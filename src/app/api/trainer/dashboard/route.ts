import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { BookingStatus } from "@/generated/prisma"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"

export async function GET() {
  const { error, session } = await requireRole("TRAINER")
  if (error) return error

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!trainerProfile) {
    return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 })
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const [todayBookings, weekBookings, totalCustomers] = await Promise.all([
    prisma.booking.count({
      where: {
        trainerProfileId: trainerProfile.id,
        startTime: { gte: todayStart, lte: todayEnd },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.RESCHEDULED] },
      },
    }),
    prisma.booking.count({
      where: {
        trainerProfileId: trainerProfile.id,
        startTime: { gte: weekStart, lte: weekEnd },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.RESCHEDULED] },
      },
    }),
    prisma.booking.groupBy({
      by: ["customerId"],
      where: {
        trainerProfileId: trainerProfile.id,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.RESCHEDULED] },
      },
    }).then((groups) => groups.length),
  ])

  return NextResponse.json({ todayBookings, weekBookings, totalCustomers })
}
