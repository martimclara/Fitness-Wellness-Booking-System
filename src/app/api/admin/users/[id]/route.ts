import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"

// PATCH — update user account (block/unblock, reset password)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Block / unblock
  if (body.isBlocked !== undefined) {
    await prisma.user.update({
      where: { id },
      data: { isBlocked: body.isBlocked },
    })
  }

  // Reset password — generate a new temporary password
  if (body.resetPassword) {
    const tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    })
    return NextResponse.json({ success: true, tempPassword })
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isBlocked: true },
  })

  return NextResponse.json(updated)
}

// DELETE — permanently delete a user and all their data
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params

  // Prevent admin from deleting themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Cascade delete is set in the schema for TrainerProfile -> User
  // but bookings reference customer/trainer, so we need to handle carefully
  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
