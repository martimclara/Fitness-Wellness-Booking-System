import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"

export async function GET() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(customers)
}
