"use client"

import useSWR from "swr"
import type { BookingWithDetails } from "@/types"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch")
    return r.json()
  })

export function useBookings() {
  const { data, error, isLoading, mutate } = useSWR<BookingWithDetails[]>(
    "/api/bookings",
    fetcher
  )

  return {
    bookings: data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}

export function useBooking(id: string) {
  const { data, error, isLoading, mutate } = useSWR<BookingWithDetails>(
    `/api/bookings/${id}`,
    fetcher
  )

  return {
    booking: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}
