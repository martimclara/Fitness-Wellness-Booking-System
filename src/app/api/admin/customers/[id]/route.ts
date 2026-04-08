import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { id } = await params

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          service: true,
          trainerProfile: { include: { user: { select: { name: true } } } },
          payment: true,
        },
        orderBy: { startTime: "desc" },
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  return NextResponse.json(customer)
}
