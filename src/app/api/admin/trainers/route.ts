import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma"
import { requireRole } from "@/lib/auth-guard"
import { createTrainerSchema } from "@/lib/validators"

export async function GET() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const trainers = await prisma.trainerProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      services: { include: { service: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(trainers)
}

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const body = await request.json()
  const parsed = createTrainerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, bio, photo, specialties, certifications, yearsExperience, serviceIds } = parsed.data

  // Create user + trainer profile in transaction
  const trainer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let user = await tx.user.findUnique({ where: { email } })

    if (!user) {
      const tempPassword = await bcrypt.hash(Math.random().toString(36), 12)
      user = await tx.user.create({
        data: { name, email, passwordHash: tempPassword, role: "TRAINER" },
      })
    } else {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "TRAINER" },
      })
    }

    const profile = await tx.trainerProfile.create({
      data: {
        userId: user.id,
        bio,
        photo,
        specialties,
        certifications,
        yearsExperience,
        services: {
          create: serviceIds.map((serviceId: string) => ({ serviceId })),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        services: { include: { service: true } },
      },
    })

    return profile
  })

  return NextResponse.json(trainer, { status: 201 })
}
