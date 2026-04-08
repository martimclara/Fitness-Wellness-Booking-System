import { prisma } from "./prisma"
import { Resend } from "resend"

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

async function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null
  const twilio = (await import("twilio")).default
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export async function processNotifications() {
  const pending = await prisma.notification.findMany({
    where: { sentAt: null, failedAt: null },
    include: { user: true },
    take: 50,
    orderBy: { createdAt: "asc" },
  })

  for (const notification of pending) {
    try {
      if (notification.channel === "EMAIL") {
        await sendEmail(
          notification.user.email,
          notification.subject ?? "FitBook Notification",
          notification.body
        )
      } else if (notification.channel === "SMS" && notification.user.phone) {
        await sendSms(notification.user.phone, notification.body)
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: { sentAt: new Date() },
      })
    } catch (error) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          failedAt: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  }

  return pending.length
}

export async function processReminders() {
  const dueReminders = await prisma.reminder.findMany({
    where: {
      sentAt: null,
      scheduledAt: { lte: new Date() },
      booking: {
        status: "CONFIRMED",
      },
    },
    include: {
      booking: {
        include: {
          customer: true,
          service: true,
          trainerProfile: { include: { user: true } },
        },
      },
    },
    take: 50,
  })

  for (const reminder of dueReminders) {
    const { booking } = reminder
    const body = `Reminder: Your ${booking.service.name} session with ${booking.trainerProfile.user.name} is coming up on ${booking.startTime.toISOString()}.`

    try {
      if (reminder.channel === "EMAIL") {
        await sendEmail(
          booking.customer.email,
          `Upcoming: ${booking.service.name}`,
          body
        )
      } else if (
        reminder.channel === "SMS" &&
        booking.customer.phone
      ) {
        await sendSms(booking.customer.phone, body)
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentAt: new Date() },
      })
    } catch {
      // Will retry on next cron run
    }
  }

  return dueReminders.length
}

async function sendEmail(to: string, subject: string, body: string) {
  const resend = getResend()
  if (!resend) {
    console.log(`[Email] To: ${to}, Subject: ${subject}, Body: ${body}`)
    return
  }

  await resend.emails.send({
    from: "FitBook <noreply@fitbook.com>",
    to,
    subject,
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">FitBook</h2>
      <p>${body}</p>
    </div>`,
  })
}

async function sendSms(to: string, body: string) {
  const twilioClient = await getTwilioClient()
  if (!twilioClient) {
    console.log(`[SMS] To: ${to}, Body: ${body}`)
    return
  }

  await twilioClient.messages.create({
    body,
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
  })
}
