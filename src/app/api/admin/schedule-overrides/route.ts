import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guard"
import { scheduleOverrideSchema } from "@/lib/validators"

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const body = await request.json()
  const parsed = scheduleOverrideSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const override = await prisma.scheduleOverride.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  })

  return NextResponse.json(override, { status: 201 })
}
