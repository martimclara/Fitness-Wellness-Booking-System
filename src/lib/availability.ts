import { prisma } from "./prisma"
import { fromZonedTime } from "date-fns-tz"
import { addMinutes, parse, isBefore, isEqual } from "date-fns"
import { APP_TIMEZONE } from "./utils"
import type { TimeSlot } from "@/types"
import { BookingStatus } from "@/generated/prisma"
import type { ScheduleOverride, Booking, Service } from "@/generated/prisma"

export async function getAvailableSlots(
  trainerProfileId: string,
  serviceId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  const [service, trainerProfile] = await Promise.all([
    prisma.service.findUniqueOrThrow({ where: { id: serviceId } }),
    prisma.trainerProfile.findUniqueOrThrow({
      where: { id: trainerProfileId },
    }),
  ])

  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()

  // Get recurring schedules for this day
  const schedules = await prisma.schedule.findMany({
    where: {
      trainerProfileId: trainerProfile.id,
      dayOfWeek,
      isActive: true,
    },
  })

  if (schedules.length === 0) return []

  // Check for overrides on this date
  const overrides = await prisma.scheduleOverride.findMany({
    where: {
      trainerProfileId: trainerProfile.id,
      date,
    },
  })

  // If the entire day is blocked (override with no time range)
  const dayBlocked = overrides.some(
    (o: ScheduleOverride) => o.isBlocked && !o.startTime && !o.endTime
  )
  if (dayBlocked) return []

  // Generate all possible time slots from schedules
  const allSlots: string[] = []
  for (const schedule of schedules) {
    const slots = generateSlotsFromRange(
      schedule.startTime,
      schedule.endTime,
      service.durationMinutes
    )
    allSlots.push(...slots)
  }

  // Remove slots that fall within blocked overrides
  const blockedOverrides = overrides.filter((o: ScheduleOverride) => o.isBlocked && o.startTime)
  const availableSlotTimes = allSlots.filter((slot) => {
    return !blockedOverrides.some((override) => {
      return slot >= override.startTime! && slot < override.endTime!
    })
  })

  // Get existing bookings for this trainer on this date
  const dayStartUtc = fromZonedTime(
    parse(`${dateStr} 00:00`, "yyyy-MM-dd HH:mm", new Date()),
    APP_TIMEZONE
  )
  const dayEndUtc = fromZonedTime(
    parse(`${dateStr} 23:59`, "yyyy-MM-dd HH:mm", new Date()),
    APP_TIMEZONE
  )

  const existingBookings = await prisma.booking.findMany({
    where: {
      trainerProfileId: trainerProfile.id,
      startTime: { gte: dayStartUtc },
      endTime: { lte: dayEndUtc },
      status: {
        notIn: [BookingStatus.CANCELLED, BookingStatus.RESCHEDULED],
      },
    },
    include: { service: true },
  })

  // Check each slot for availability
  const slots: TimeSlot[] = availableSlotTimes.map((time) => {
    const slotStartLocal = parse(
      `${dateStr} ${time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    )
    const slotStartUtc = fromZonedTime(slotStartLocal, APP_TIMEZONE)
    const slotEndUtc = addMinutes(slotStartUtc, service.durationMinutes)

    // Check for overlapping bookings
    const hasConflict = existingBookings.some((booking) => {
      // For multi-participant services, check participant count instead
      if (
        service.maxParticipants > 1 &&
        booking.serviceId === serviceId &&
        isEqual(booking.startTime, slotStartUtc)
      ) {
        // Will be checked separately for capacity
        return false
      }
      // Time overlap check: booking overlaps if it starts before slot ends AND ends after slot starts
      return (
        isBefore(booking.startTime, slotEndUtc) &&
        isBefore(slotStartUtc, booking.endTime)
      )
    })

    // For multi-participant services, check capacity and return spots info
    if (service.maxParticipants > 1) {
      const classBookings = existingBookings.filter(
        (b) =>
          b.serviceId === serviceId && isEqual(b.startTime, slotStartUtc)
      )
      const spotsLeft = service.maxParticipants - classBookings.length
      return {
        time,
        available: spotsLeft > 0,
        spotsLeft,
        maxParticipants: service.maxParticipants,
      }
    }

    return { time, available: !hasConflict }
  })

  return slots
}

function generateSlotsFromRange(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = []
  const base = parse(startTime, "HH:mm", new Date())
  const end = parse(endTime, "HH:mm", new Date())

  let current = base
  while (
    isBefore(addMinutes(current, durationMinutes), end) ||
    isEqual(addMinutes(current, durationMinutes), end)
  ) {
    const hours = current.getHours().toString().padStart(2, "0")
    const minutes = current.getMinutes().toString().padStart(2, "0")
    slots.push(`${hours}:${minutes}`)
    current = addMinutes(current, durationMinutes)
  }

  return slots
}
