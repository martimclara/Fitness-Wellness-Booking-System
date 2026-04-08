"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useBooking } from "@/hooks/use-bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCents, formatLisbon } from "@/lib/utils"
import { Calendar, Clock, User, Download, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { generateGoogleCalendarUrl, generateOutlookUrl } from "@/lib/calendar-export"

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
  RESCHEDULED: "bg-purple-100 text-purple-800",
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { booking, isLoading, refresh } = useBooking(id)
  const [cancelling, setCancelling] = useState(false)

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    setCancelling(true)

    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(
        data.refundAmount > 0
          ? `Booking cancelled. Refund of ${formatCents(data.refundAmount)} will be processed.`
          : "Booking cancelled."
      )
      refresh()
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to cancel")
    }
    setCancelling(false)
  }

  if (isLoading || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  const canCancel = ["CONFIRMED", "PENDING_PAYMENT"].includes(booking.status)

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        &larr; Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{booking.service.name}</CardTitle>
            <Badge className={statusColors[booking.status] ?? ""}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{booking.trainerProfile.user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatLisbon(new Date(booking.startTime), "EEEE, dd MMM yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatLisbon(new Date(booking.startTime), "HH:mm")} -{" "}
                {formatLisbon(new Date(booking.endTime), "HH:mm")}
              </span>
            </div>
            {booking.payment && (
              <div className="font-semibold">
                {formatCents(booking.payment.amount)}
                {booking.payment.refundedAmount > 0 && (
                  <span className="text-sm text-muted-foreground ml-1">
                    (refunded {formatCents(booking.payment.refundedAmount)})
                  </span>
                )}
              </div>
            )}
          </div>

          {booking.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            </>
          )}

          {booking.status === "CONFIRMED" && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Add to Calendar</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/bookings/${id}/calendar`} download>
                      <Download className="h-3 w-3 mr-1" />
                      Download .ics
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={generateGoogleCalendarUrl(booking as Parameters<typeof generateGoogleCalendarUrl>[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Google Calendar
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={generateOutlookUrl(booking as Parameters<typeof generateOutlookUrl>[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Outlook
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}

          {canCancel && (
            <>
              <Separator />
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancel Booking
                </Button>
                {booking.status === "CONFIRMED" && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/bookings/${id}/reschedule`)}
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
