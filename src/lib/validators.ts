import { z } from "zod"

// ─── Auth ───────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
})

// ─── Services ───────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["CLASS", "PERSONAL", "STUDIO"]),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.number().int().min(0),
  maxParticipants: z.number().int().min(1).default(1),
  color: z.string().optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

// ─── Trainers ───────────────────────────────────────────

export const createTrainerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  bio: z.string().optional(),
  photo: z.string().url().optional(),
  specialties: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  yearsExperience: z.number().int().min(0).default(0),
  serviceIds: z.array(z.string()).default([]),
})

export const updateTrainerSchema = createTrainerSchema.partial()

// ─── Schedules ──────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const scheduleEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Must be HH:mm format"),
  endTime: z.string().regex(timeRegex, "Must be HH:mm format"),
  isActive: z.boolean().default(true),
})

export const setScheduleSchema = z.object({
  entries: z.array(scheduleEntrySchema),
})

export const scheduleOverrideSchema = z.object({
  trainerProfileId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  isBlocked: z.boolean().default(true),
  reason: z.string().optional(),
})

// ─── Bookings ───────────────────────────────────────────

export const createBookingSchema = z.object({
  trainerId: z.string(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(timeRegex),
  notes: z.string().optional(),
})

export const rescheduleBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(timeRegex),
})

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
})

// ─── Availability ───────────────────────────────────────

export const availabilityQuerySchema = z.object({
  trainerId: z.string(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// ─── Type exports ───────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type CreateTrainerInput = z.infer<typeof createTrainerSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>
