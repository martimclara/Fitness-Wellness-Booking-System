import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { updateServiceSchema } from "@/lib/validators"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = updateServiceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = await prisma.service.findUnique({ where: { id } })
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  const updated = await prisma.service.update({
    where: { id },
    data: parsed.data,
    include: {
      trainers: { include: { trainerProfile: { include: { user: { select: { name: true } } } } } },
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
  await prisma.service.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
