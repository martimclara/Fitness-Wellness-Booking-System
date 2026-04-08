import { NextResponse } from "next/server"
import { processNotifications, processReminders } from "@/lib/notification-service"
import { prisma } from "@/lib/prisma"
import { BookingStatus } from "@/generated/prisma"

export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Process pending notifications and reminders
  const [notificationCount, reminderCount] = await Promise.all([
    processNotifications(),
    processReminders(),
  ])

  // Clean up abandoned PENDING_PAYMENT bookings older than 15 minutes
  const cutoff = new Date(Date.now() - 15 * 60 * 1000)
  const cleaned = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.PENDING_PAYMENT,
      createdAt: { lt: cutoff },
    },
    data: { status: BookingStatus.CANCELLED },
  })

  return NextResponse.json({
    notifications: notificationCount,
    reminders: reminderCount,
    cleanedBookings: cleaned.count,
  })
}
