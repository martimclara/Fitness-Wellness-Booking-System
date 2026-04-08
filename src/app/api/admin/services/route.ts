import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { createServiceSchema } from "@/lib/validators"

export async function GET() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const services = await prisma.service.findMany({
    include: { trainers: { include: { trainerProfile: { include: { user: { select: { name: true } } } } } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(services)
}

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const body = await request.json()
  const parsed = createServiceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = await prisma.service.create({ data: parsed.data })
  return NextResponse.json(service, { status: 201 })
}
