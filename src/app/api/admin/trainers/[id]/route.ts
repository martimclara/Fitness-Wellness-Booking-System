import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { updateTrainerSchema } from "@/lib/validators"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = updateTrainerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, bio, photo, specialties, certifications, yearsExperience, serviceIds } = parsed.data

  const trainer = await prisma.trainerProfile.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    // Update user fields
    if (name || email) {
      await tx.user.update({
        where: { id: trainer.userId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
        },
      })
    }

    // Update trainer profile
    await tx.trainerProfile.update({
      where: { id },
      data: {
        ...(bio !== undefined ? { bio } : {}),
        ...(photo !== undefined ? { photo } : {}),
        ...(specialties ? { specialties } : {}),
        ...(certifications ? { certifications } : {}),
        ...(yearsExperience !== undefined ? { yearsExperience } : {}),
      },
    })

    // Update service assignments if provided
    if (serviceIds) {
      await tx.serviceOnTrainer.deleteMany({ where: { trainerProfileId: id } })
      if (serviceIds.length > 0) {
        await tx.serviceOnTrainer.createMany({
          data: serviceIds.map((serviceId: string) => ({
            trainerProfileId: id,
            serviceId,
          })),
        })
      }
    }
  })

  const updated = await prisma.trainerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      services: { include: { service: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params

  // Soft delete — deactivate instead of removing
  await prisma.trainerProfile.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
