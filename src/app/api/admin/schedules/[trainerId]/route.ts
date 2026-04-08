import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { setScheduleSchema } from "@/lib/validators"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trainerId: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { trainerId } = await params

  const schedules = await prisma.schedule.findMany({
    where: { trainerProfileId: trainerId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return NextResponse.json(schedules)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ trainerId: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { trainerId } = await params
  const body = await request.json()
  const parsed = setScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Replace all schedules for this trainer
  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { trainerProfileId: trainerId } }),
    ...parsed.data.entries.map((entry) =>
      prisma.schedule.create({
        data: { trainerProfileId: trainerId, ...entry },
      })
    ),
  ])

  const schedules = await prisma.schedule.findMany({
    where: { trainerProfileId: trainerId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  return NextResponse.json(schedules)
}
