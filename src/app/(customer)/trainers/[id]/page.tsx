"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { TrainerProfileView } from "@/components/features/trainers/trainer-profile"
import { TimeSlotGrid } from "@/components/features/booking/time-slot-grid"
import { BookingSummary } from "@/components/features/booking/booking-summary"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAvailability } from "@/hooks/use-availability"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { TrainerPublic } from "@/types"

export default function TrainerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [trainer, setTrainer] = useState<TrainerPublic & { schedule: { dayOfWeek: number; startTime: string; endTime: string }[] } | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [booking, setBooking] = useState(false)

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null
  const { slots, isLoading: slotsLoading } = useAvailability(
    id,
    selectedService,
    dateStr
  )

  useEffect(() => {
    fetch(`/api/trainers/${id}`)
      .then((r) => r.json())
      .then(setTrainer)
  }, [id])

  const selectedServiceData = trainer?.services.find(
    (s) => s.id === selectedService
  )

  async function handleBook() {
    if (!session) {
      router.push("/login")
      return
    }
    if (!selectedService || !dateStr || !selectedTime) return

    setBooking(true)
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainerId: id,
        serviceId: selectedService,
        date: dateStr,
        time: selectedTime,
        notes: notes || undefined,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success("Booking created! Redirecting to payment...")
      router.push(`/checkout?bookingId=${data.booking.id}&clientSecret=${data.clientSecret}`)
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to create booking")
      setBooking(false)
    }
  }

  if (!trainer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TrainerProfileView trainer={trainer} />

          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Select a Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trainer.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service.id)
                      setSelectedTime(null)
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedService === service.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.durationMinutes} min
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>2. Pick a Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setSelectedTime(null)
                  }}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border w-fit"
                />
              </CardContent>
            </Card>
          )}

          {/* Time Selection */}
          {selectedService && selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>3. Choose a Time</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSlotGrid
                  slots={slots}
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                  isLoading={slotsLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {selectedTime && (
            <Card>
              <CardHeader>
                <CardTitle>4. Additional Notes (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="notes" className="sr-only">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {selectedServiceData && dateStr && selectedTime && (
              <>
                <BookingSummary
                  trainerName={trainer.name ?? "Trainer"}
                  serviceName={selectedServiceData.name}
                  date={dateStr}
                  time={selectedTime}
                  duration={selectedServiceData.durationMinutes}
                  price={selectedServiceData.price}
                />
                <Button
                  onClick={handleBook}
                  disabled={booking}
                  className="w-full"
                  size="lg"
                >
                  {booking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
