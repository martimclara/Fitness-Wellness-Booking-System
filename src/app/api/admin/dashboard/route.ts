import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"

export async function GET() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalBookings, monthlyRevenue, activeCustomers, upcomingBookings, recentBookings] =
    await Promise.all([
      prisma.booking.count({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      }),
      prisma.payment.aggregate({
        where: {
          status: "CAPTURED",
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          bookings: { some: { createdAt: { gte: startOfMonth } } },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CONFIRMED",
          startTime: { gte: now },
        },
      }),
      prisma.booking.findMany({
        where: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
        include: {
          customer: { select: { name: true, email: true } },
          service: true,
          trainerProfile: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startTime: "asc" },
        take: 10,
      }),
    ])

  return NextResponse.json({
    totalBookings,
    totalRevenue: monthlyRevenue._sum.amount ?? 0,
    activeCustomers,
    upcomingBookings,
    recentBookings,
  })
}
