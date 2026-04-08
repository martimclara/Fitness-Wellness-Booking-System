import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { setScheduleSchema } from "@/lib/validators"

export async function GET() {
  const { error, session } = await requireRole("TRAINER")
  if (error) return error

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!trainerProfile) {
    return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 })
  }

  const schedules = await prisma.schedule.findMany({
    where: { trainerProfileId: trainerProfile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return NextResponse.json(schedules)
}

export async function PUT(request: Request) {
  const { error, session } = await requireRole("TRAINER")
  if (error) return error

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!trainerProfile) {
    return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = setScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Replace all schedules for this trainer
  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { trainerProfileId: trainerProfile.id } }),
    ...parsed.data.entries.map((entry) =>
      prisma.schedule.create({
        data: { trainerProfileId: trainerProfile.id, ...entry },
      })
    ),
  ])

  const schedules = await prisma.schedule.findMany({
    where: { trainerProfileId: trainerProfile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return NextResponse.json(schedules)
}
