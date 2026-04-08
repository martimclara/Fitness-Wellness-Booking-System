"use client"

import useSWR from "swr"
import type { TimeSlot } from "@/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAvailability(
  trainerId: string | null,
  serviceId: string | null,
  date: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<{
    slots: TimeSlot[]
    date: string
  }>(
    trainerId && serviceId && date
      ? `/api/availability?trainerId=${trainerId}&serviceId=${serviceId}&date=${date}`
      : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  return {
    slots: data?.slots ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
