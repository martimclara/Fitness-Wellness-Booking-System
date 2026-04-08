import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      trainers: {
        include: {
          trainerProfile: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(services)
}
