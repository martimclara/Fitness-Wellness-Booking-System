import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const trainer = await prisma.trainerProfile.findUnique({
    where: { id, isActive: true },
    include: {
      user: { select: { name: true, image: true } },
      services: {
        include: { service: true },
        where: { service: { isActive: true } },
      },
      schedules: { where: { isActive: true } },
    },
  })

  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: trainer.id,
    name: trainer.user.name,
    photo: trainer.photo ?? trainer.user.image,
    bio: trainer.bio,
    specialties: trainer.specialties,
    certifications: trainer.certifications,
    yearsExperience: trainer.yearsExperience,
    color: trainer.color,
    services: trainer.services.map((s: typeof trainer.services[number]) => ({
      id: s.service.id,
      name: s.service.name,
      type: s.service.type,
      durationMinutes: s.service.durationMinutes,
      price: s.service.price,
    })),
    schedule: trainer.schedules.map((s: typeof trainer.schedules[number]) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  })
}
