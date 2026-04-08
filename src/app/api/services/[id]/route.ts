import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const service = await prisma.service.findUnique({
    where: { id, isActive: true },
    include: {
      trainers: {
        include: {
          trainerProfile: {
            include: { user: { select: { name: true, image: true } } },
          },
        },
        where: { trainerProfile: { isActive: true } },
      },
    },
  })

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  return NextResponse.json(service)
}
