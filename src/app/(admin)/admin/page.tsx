"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents, formatLisbon } from "@/lib/utils"
import { CalendarDays, DollarSign, Users, Clock } from "lucide-react"

type Stats = {
  totalBookings: number
  totalRevenue: number
  activeCustomers: number
  upcomingBookings: number
  recentBookings: {
    id: string
    startTime: string
    customer: { name: string; email: string }
    service: { name: string }
    trainerProfile: { user: { name: string } }
  }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: CalendarDays,
    },
    {
      title: "Monthly Revenue",
      value: formatCents(stats.totalRevenue),
      icon: DollarSign,
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers,
      icon: Users,
    },
    {
      title: "Upcoming",
      value: stats.upcomingBookings,
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <p className="text-muted-foreground">No upcoming bookings.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{booking.service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.customer.name} with{" "}
                      {booking.trainerProfile.user.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatLisbon(
                      new Date(booking.startTime),
                      "dd MMM HH:mm"
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
