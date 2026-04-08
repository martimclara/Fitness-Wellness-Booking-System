"use client"

import { cn } from "@/lib/utils"
import type { TimeSlot } from "@/types"

interface TimeSlotGridProps {
  slots: TimeSlot[]
  selectedTime: string | null
  onSelect: (time: string) => void
  isLoading: boolean
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  isLoading,
}: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No available slots for this date.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.time}
          onClick={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          className={cn(
            "h-10 rounded-md text-sm font-medium transition-colors border",
            slot.available
              ? selectedTime === slot.time
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted border-input"
              : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border-transparent line-through"
          )}
        >
          {slot.time}
        </button>
      ))}
    </div>
  )
}
