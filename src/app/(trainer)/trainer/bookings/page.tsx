"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCents } from "@/lib/utils"

type TrainerBooking = {
  id: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  customer: { name: string; email: string }
  service: { name: string; type: string; price: number; durationMinutes: number }
}

const statusColors: Record<string, string> = {
  CONFIRMED: "default",
  PENDING_PAYMENT: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
  RESCHEDULED: "secondary",
  NO_SHOW: "destructive",
}

export default function TrainerBookingsPage() {
  const [bookings, setBookings] = useState<TrainerBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/trainer/bookings")
      .then((r) => r.json())
      .then((data: TrainerBooking[]) => {
        setBookings(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const start = new Date(booking.startTime)
            return (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{booking.service.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer.name} &middot; {booking.customer.email}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {start.toLocaleDateString("pt-PT")} at{" "}
                        {start.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        {" "}&middot; {booking.service.durationMinutes} min
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{booking.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusColors[booking.status] as "default" | "secondary" | "destructive" ?? "secondary"}>
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-sm font-medium">{formatCents(booking.service.price)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
