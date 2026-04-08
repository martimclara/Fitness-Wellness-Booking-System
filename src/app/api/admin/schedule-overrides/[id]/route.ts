import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params

  await prisma.scheduleOverride.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
