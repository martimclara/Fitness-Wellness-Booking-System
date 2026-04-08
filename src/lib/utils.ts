import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, toZonedTime } from "date-fns-tz"
import { parse, addMinutes } from "date-fns"

export const APP_TIMEZONE = "Europe/Lisbon"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export function toLisbonTime(date: Date): Date {
  return toZonedTime(date, APP_TIMEZONE)
}

export function formatLisbon(date: Date, formatStr: string): string {
  return format(date, formatStr, { timeZone: APP_TIMEZONE })
}

export function parseLocalTime(timeStr: string, dateStr: string): Date {
  return parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date())
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = []
  const base = parse(startTime, "HH:mm", new Date())
  const end = parse(endTime, "HH:mm", new Date())

  let current = base
  while (addMinutes(current, durationMinutes) <= end) {
    slots.push(format(current, "HH:mm", { timeZone: APP_TIMEZONE }))
    current = addMinutes(current, durationMinutes)
  }
  return slots
}
