import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma"
import { requireRole } from "@/lib/auth-guard"
import { createTrainerSchema } from "@/lib/validators"

export async function GET() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  try {
    const trainers = await prisma.trainerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, image: true, isBlocked: true } },
        services: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(trainers)
  } catch (err) {
    console.error("[admin/trainers GET]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
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

  // Generate a readable temporary password for new users
  const tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase()
  let isNewUser = false

  // Create user + trainer profile in transaction
  const trainer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let user = await tx.user.findUnique({ where: { email } })

    if (!user) {
      isNewUser = true
      const hashedPassword = await bcrypt.hash(tempPassword, 12)
      user = await tx.user.create({
        data: { name, email, passwordHash: hashedPassword, role: "TRAINER" },
      })
    } else {
      // Existing user — promote to trainer role
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

  return NextResponse.json(
    { ...trainer, tempPassword: isNewUser ? tempPassword : undefined },
    { status: 201 }
  )
}
