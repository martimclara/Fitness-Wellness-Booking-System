import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import type { BookingStatus } from "@/generated/prisma"

export async function GET(request: NextRequest) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status") as BookingStatus | null
  const trainerId = searchParams.get("trainerId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(trainerId ? { trainerProfileId: trainerId } : {}),
      ...(from || to
        ? {
            startTime: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: true,
      trainerProfile: { include: { user: { select: { name: true } } } },
      payment: true,
    },
    orderBy: { startTime: "desc" },
    take: 100,
  })

  return NextResponse.json(bookings)
}
