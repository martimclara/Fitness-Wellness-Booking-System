"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  extendedProps: {
    customerName: string
    trainerName: string
    status: string
  }
}

export default function AdminCalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const loadEvents = useCallback((start: string, end: string) => {
    fetch(`/api/admin/bookings?from=${start}&to=${end}`)
      .then((r) => r.json())
      .then((bookings) => {
        const mapped: CalendarEvent[] = bookings.map(
          (b: {
            id: string
            startTime: string
            endTime: string
            status: string
            service: { name: string; color: string | null }
            customer: { name: string }
            trainerProfile: { color: string | null; user: { name: string } }
          }) => ({
            id: b.id,
            title: `${b.service.name} - ${b.customer.name}`,
            start: b.startTime,
            end: b.endTime,
            backgroundColor:
              b.trainerProfile.color ?? b.service.color ?? undefined,
            extendedProps: {
              customerName: b.customer.name,
              trainerName: b.trainerProfile.user.name,
              status: b.status,
            },
          })
        )
        setEvents(mapped)
      })
  }, [])

  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    loadEvents(start, end)
  }, [loadEvents])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendar</h1>
      <Card>
        <CardContent className="p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            editable={true}
            droppable={true}
            eventDrop={(info) => {
              const { event } = info
              fetch(`/api/bookings/${event.id}/reschedule`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  date: event.start!.toISOString().split("T")[0],
                  time: event.start!.toTimeString().slice(0, 5),
                }),
              }).then((res) => {
                if (res.ok) {
                  toast.success("Booking rescheduled")
                } else {
                  info.revert()
                  toast.error("Failed to reschedule")
                }
              })
            }}
            datesSet={(dateInfo) => {
              loadEvents(
                dateInfo.start.toISOString(),
                dateInfo.end.toISOString()
              )
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            height="auto"
            nowIndicator={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
