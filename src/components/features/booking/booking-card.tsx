import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCents, formatLisbon } from "@/lib/utils"
import { Calendar, Clock, User } from "lucide-react"
import type { BookingWithDetails } from "@/types"

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
  RESCHEDULED: "bg-purple-100 text-purple-800",
}

export function BookingCard({ booking }: { booking: BookingWithDetails }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{booking.service.name}</h3>
              <Badge className={statusColors[booking.status] ?? ""}>
                {booking.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {booking.trainerProfile.user.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatLisbon(new Date(booking.startTime), "dd MMM yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatLisbon(new Date(booking.startTime), "HH:mm")} -{" "}
                {formatLisbon(new Date(booking.endTime), "HH:mm")}
              </span>
            </div>
            {booking.payment && (
              <p className="text-sm font-medium">
                {formatCents(booking.payment.amount)}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/bookings/${booking.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
