"use client"

import { useBookings } from "@/hooks/use-bookings"
import { BookingCard } from "@/components/features/booking/booking-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BookingsPage() {
  const { bookings, isLoading } = useBookings()

  const upcoming = bookings.filter(
    (b) =>
      ["CONFIRMED", "PENDING_PAYMENT"].includes(b.status) &&
      new Date(b.startTime) > new Date()
  )
  const past = bookings.filter(
    (b) =>
      ["COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(b.status) ||
      new Date(b.startTime) <= new Date()
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No bookings yet. Browse our trainers to book your first session!
        </p>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No upcoming bookings.
              </p>
            ) : (
              upcoming.map((b) => <BookingCard key={b.id} booking={b} />)
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-3 mt-4">
            {past.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No past bookings.
              </p>
            ) : (
              past.map((b) => <BookingCard key={b.id} booking={b} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
