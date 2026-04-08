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
          <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
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
      {slots.map((slot) => {
        const isFull = !slot.available && slot.maxParticipants !== undefined
        const isClassWithSpots = slot.available && slot.spotsLeft !== undefined

        return (
          <button
            key={slot.time}
            onClick={() => slot.available && onSelect(slot.time)}
            disabled={!slot.available}
            className={cn(
              "h-12 rounded-md text-sm font-medium transition-colors border flex flex-col items-center justify-center",
              slot.available
                ? selectedTime === slot.time
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted border-input"
                : isFull
                  ? "bg-destructive/10 text-destructive border-destructive/20 cursor-not-allowed"
                  : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border-transparent line-through"
            )}
          >
            <span>{slot.time}</span>
            {isFull && (
              <span className="text-[10px] font-semibold uppercase">Full</span>
            )}
            {isClassWithSpots && (
              <span className={cn(
                "text-[10px]",
                slot.spotsLeft! <= 3 ? "text-orange-600 font-semibold" : "text-muted-foreground"
              )}>
                {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? "s" : ""} left
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
