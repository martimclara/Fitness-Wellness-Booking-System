import ical, { ICalCalendarMethod } from "ical-generator"
import type { Booking, Service } from "@/generated/prisma"

type BookingForExport = Booking & {
  service: Service
  trainerProfile: { user: { name: string | null } }
}

export function generateIcs(booking: BookingForExport): string {
  const calendar = ical({
    name: "FitBook",
    method: ICalCalendarMethod.REQUEST,
  })

  calendar.createEvent({
    start: booking.startTime,
    end: booking.endTime,
    summary: `${booking.service.name} with ${booking.trainerProfile.user.name}`,
    description: `Service: ${booking.service.name}\nTrainer: ${booking.trainerProfile.user.name}\nDuration: ${booking.service.durationMinutes} minutes`,
    location: "FitBook Studio",
  })

  return calendar.toString()
}

export function generateGoogleCalendarUrl(booking: BookingForExport): string {
  const start = booking.startTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const end = booking.endTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const title = encodeURIComponent(`${booking.service.name} with ${booking.trainerProfile.user.name}`)
  const details = encodeURIComponent(`Duration: ${booking.service.durationMinutes} minutes`)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent("FitBook Studio")}`
}

export function generateOutlookUrl(booking: BookingForExport): string {
  const start = booking.startTime.toISOString()
  const end = booking.endTime.toISOString()
  const title = encodeURIComponent(`${booking.service.name} with ${booking.trainerProfile.user.name}`)

  return `https://outlook.live.com/calendar/0/action/compose?subject=${title}&startdt=${start}&enddt=${end}&location=${encodeURIComponent("FitBook Studio")}`
}
