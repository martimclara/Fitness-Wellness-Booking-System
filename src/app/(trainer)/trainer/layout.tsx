"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Clock, LayoutDashboard } from "lucide-react"

const trainerLinks = [
  { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainer/schedule", label: "My Schedule", icon: Clock },
  { href: "/trainer/bookings", label: "My Bookings", icon: Calendar },
]

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 border-r bg-white p-4 space-y-1 hidden md:block">
        <h2 className="text-lg font-bold mb-4">Trainer</h2>
        {trainerLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </aside>
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  )
}
