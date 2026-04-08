import type {
  User,
  TrainerProfile,
  Service,
  Booking,
  Payment,
  Schedule,
  ScheduleOverride,
} from "@/generated/prisma"

export type TrainerWithProfile = User & {
  trainerProfile: TrainerProfile & {
    services: { service: Service }[]
  }
}

export type TrainerPublic = {
  id: string
  name: string
  photo: string | null
  bio: string | null
  specialties: string[]
  certifications: string[]
  yearsExperience: number
  services: {
    id: string
    name: string
    type: string
    durationMinutes: number
    price: number
  }[]
}

export type TimeSlot = {
  time: string // "09:00"
  available: boolean
  spotsLeft?: number // for group classes: remaining spots
  maxParticipants?: number // for group classes: total capacity
}

export type BookingWithDetails = Booking & {
  service: Service
  trainerProfile: TrainerProfile & { user: Pick<User, "name" | "image"> }
  payment: Payment | null
}

export type AvailabilityQuery = {
  trainerId: string
  serviceId: string
  date: string // "YYYY-MM-DD"
}

export type DashboardStats = {
  totalBookings: number
  totalRevenue: number
  activeCustomers: number
  upcomingBookings: number
}
