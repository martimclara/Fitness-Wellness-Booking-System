import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const specialty = searchParams.get("specialty")

  const trainers = await prisma.trainerProfile.findMany({
    where: {
      isActive: true,
      ...(specialty ? { specialties: { has: specialty } } : {}),
    },
    include: {
      user: { select: { name: true, image: true } },
      services: { include: { service: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const result = trainers.map((t: typeof trainers[number]) => ({
    id: t.id,
    name: t.user.name,
    photo: t.photo ?? t.user.image,
    bio: t.bio,
    specialties: t.specialties,
    certifications: t.certifications,
    yearsExperience: t.yearsExperience,
    services: t.services.map((s: typeof t.services[number]) => ({
      id: s.service.id,
      name: s.service.name,
      type: s.service.type,
      durationMinutes: s.service.durationMinutes,
      price: s.service.price,
    })),
  }))

  return NextResponse.json(result)
}
