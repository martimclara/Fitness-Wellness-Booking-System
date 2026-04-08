import { prisma } from "./prisma"
import { stripe } from "./stripe"
import { fromZonedTime } from "date-fns-tz"
import { addMinutes, parse, differenceInHours } from "date-fns"
import { APP_TIMEZONE } from "./utils"
import { BookingStatus, NotificationChannel, NotificationType, Prisma } from "@/generated/prisma"

export async function createBooking(
  customerId: string,
  trainerProfileId: string,
  serviceId: string,
  dateStr: string,
  timeStr: string,
  notes?: string
) {
  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
  })

  const slotStartLocal = parse(
    `${dateStr} ${timeStr}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  )
  const startTime = fromZonedTime(slotStartLocal, APP_TIMEZONE)
  const endTime = addMinutes(startTime, service.durationMinutes)

  // Use a transaction with conflict check
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Check for conflicting bookings (application-level lock)
    const conflicts = await tx.booking.findMany({
      where: {
        trainerProfileId,
        status: {
          notIn: [BookingStatus.CANCELLED, BookingStatus.RESCHEDULED],
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    })

    if (service.type === "CLASS" && service.maxParticipants > 1) {
      const sameClassBookings = conflicts.filter(
        (b: { serviceId: string }) => b.serviceId === serviceId
      )
      if (sameClassBookings.length >= service.maxParticipants) {
        throw new Error("This class is fully booked")
      }
    } else if (conflicts.length > 0) {
      throw new Error("This time slot is no longer available")
    }

    // Create Stripe PaymentIntent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: service.price,
      currency: "eur",
      capture_method: "manual",
      metadata: {
        customerId,
        trainerProfileId,
        serviceId,
      },
    })

    // Create booking
    const booking = await tx.booking.create({
      data: {
        customerId,
        trainerProfileId,
        serviceId,
        startTime,
        endTime,
        notes,
        status: BookingStatus.PENDING_PAYMENT,
        payment: {
          create: {
            stripePaymentIntentId: paymentIntent.id,
            amount: service.price,
            currency: "eur",
          },
        },
      },
      include: {
        service: true,
        trainerProfile: { include: { user: true } },
        payment: true,
      },
    })

    // Create reminders (24h and 1h before)
    await tx.reminder.createMany({
      data: [
        {
          bookingId: booking.id,
          scheduledAt: addMinutes(startTime, -24 * 60),
          channel: NotificationChannel.EMAIL,
        },
        {
          bookingId: booking.id,
          scheduledAt: addMinutes(startTime, -60),
          channel: NotificationChannel.SMS,
        },
      ],
    })

    return { booking, clientSecret: paymentIntent.client_secret }
  })

  return result
}

export async function confirmBooking(stripePaymentIntentId: string) {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { stripePaymentIntentId },
    include: { booking: { include: { customer: true, service: true, trainerProfile: { include: { user: true } } } } },
  })

  // Capture the payment
  await stripe.paymentIntents.capture(stripePaymentIntentId)

  // Update payment and booking status
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CAPTURED" },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    }),
    // Queue confirmation notification
    prisma.notification.create({
      data: {
        userId: payment.booking.customerId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.BOOKING_CONFIRMATION,
        subject: `Booking Confirmed: ${payment.booking.service.name}`,
        body: `Your booking with ${payment.booking.trainerProfile.user.name} on ${payment.booking.startTime.toISOString()} has been confirmed.`,
      },
    }),
  ])

  return payment.booking
}

export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason?: string
) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { payment: true, service: true, trainerProfile: { include: { user: true } } },
  })

  if (booking.customerId !== userId && booking.trainerProfile.userId !== userId) {
    throw new Error("Unauthorized")
  }

  if (
    booking.status === BookingStatus.CANCELLED ||
    booking.status === BookingStatus.COMPLETED
  ) {
    throw new Error("Booking cannot be cancelled")
  }

  // Calculate refund amount based on policy
  const hoursUntilBooking = differenceInHours(booking.startTime, new Date())
  let refundAmount = 0
  if (booking.payment && booking.payment.status === "CAPTURED") {
    if (hoursUntilBooking > 24) {
      refundAmount = booking.payment.amount // full refund
    } else if (hoursUntilBooking > 12) {
      refundAmount = Math.floor(booking.payment.amount * 0.5) // 50%
    }
    // else no refund
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.booking.update({
      where: { id: bookingId, version: booking.version },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        version: { increment: 1 },
      },
    })

    if (refundAmount > 0 && booking.payment) {
      await stripe.refunds.create({
        payment_intent: booking.payment.stripePaymentIntentId,
        amount: refundAmount,
      })

      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: refundAmount === booking.payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundedAmount: refundAmount,
        },
      })
    }

    // Queue cancellation notification
    await tx.notification.create({
      data: {
        userId: booking.customerId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.BOOKING_CANCELLATION,
        subject: `Booking Cancelled: ${booking.service.name}`,
        body: `Your booking with ${booking.trainerProfile.user.name} has been cancelled.${refundAmount > 0 ? ` A refund of €${(refundAmount / 100).toFixed(2)} will be processed.` : ""}`,
      },
    })

    // Delete pending reminders
    await tx.reminder.deleteMany({
      where: { bookingId, sentAt: null },
    })
  })

  return { refundAmount }
}

export async function rescheduleBooking(
  bookingId: string,
  userId: string,
  newDateStr: string,
  newTimeStr: string
) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { service: true, payment: true, trainerProfile: { include: { user: true } } },
  })

  if (booking.customerId !== userId) {
    throw new Error("Unauthorized")
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new Error("Only confirmed bookings can be rescheduled")
  }

  const newStartLocal = parse(
    `${newDateStr} ${newTimeStr}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  )
  const newStartTime = fromZonedTime(newStartLocal, APP_TIMEZONE)
  const newEndTime = addMinutes(newStartTime, booking.service.durationMinutes)

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Check for conflicts at new time
    const conflicts = await tx.booking.findMany({
      where: {
        trainerProfileId: booking.trainerProfileId,
        status: {
          notIn: [BookingStatus.CANCELLED, BookingStatus.RESCHEDULED],
        },
        id: { not: bookingId },
        startTime: { lt: newEndTime },
        endTime: { gt: newStartTime },
      },
    })

    if (conflicts.length > 0) {
      throw new Error("New time slot is not available")
    }

    // Mark old booking as rescheduled
    await tx.booking.update({
      where: { id: bookingId, version: booking.version },
      data: {
        status: BookingStatus.RESCHEDULED,
        version: { increment: 1 },
      },
    })

    // Create new booking (already paid)
    const newBooking = await tx.booking.create({
      data: {
        customerId: booking.customerId,
        trainerProfileId: booking.trainerProfileId,
        serviceId: booking.serviceId,
        startTime: newStartTime,
        endTime: newEndTime,
        status: BookingStatus.CONFIRMED,
        notes: booking.notes,
      },
    })

    // Move payment to new booking
    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { bookingId: newBooking.id },
      })
    }

    // Delete old reminders, create new ones
    await tx.reminder.deleteMany({
      where: { bookingId, sentAt: null },
    })
    await tx.reminder.createMany({
      data: [
        {
          bookingId: newBooking.id,
          scheduledAt: addMinutes(newStartTime, -24 * 60),
          channel: NotificationChannel.EMAIL,
        },
        {
          bookingId: newBooking.id,
          scheduledAt: addMinutes(newStartTime, -60),
          channel: NotificationChannel.SMS,
        },
      ],
    })

    // Queue notification
    await tx.notification.create({
      data: {
        userId: booking.customerId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.BOOKING_RESCHEDULED,
        subject: `Booking Rescheduled: ${booking.service.name}`,
        body: `Your booking with ${booking.trainerProfile.user.name} has been rescheduled to ${newStartTime.toISOString()}.`,
      },
    })

    return newBooking
  })
}
