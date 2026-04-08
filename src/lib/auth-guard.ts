import { auth } from "./auth"
import { NextResponse } from "next/server"
import type { Role } from "@/generated/prisma"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export async function requireRole(...roles: Role[]) {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }
  if (!roles.includes(session!.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null }
  }
  return { error: null, session: session! }
}
