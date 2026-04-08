"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCents } from "@/lib/utils"
import { Clock, Users } from "lucide-react"
import type { Service, ServiceType } from "@/generated/prisma"

export default function BookPage() {
  const [services, setServices] = useState<(Service & { trainers: { trainerProfile: { id: string; user: { name: string } } }[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
      .finally(() => setLoading(false))
  }, [])

  const typeLabels: Record<ServiceType, string> = {
    CLASS: "Group Class",
    PERSONAL: "Personal Training",
    STUDIO: "Studio Booking",
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Book a Session</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a service to get started.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {typeLabels[service.type]}
                    </Badge>
                  </div>
                  <p className="font-bold text-lg">{formatCents(service.price)}</p>
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.durationMinutes} min
                  </span>
                  {service.maxParticipants > 1 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Max {service.maxParticipants}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {service.trainers.length} trainer{service.trainers.length !== 1 ? "s" : ""} available
                </div>
                <Button asChild className="w-full">
                  <Link href={`/book/${service.id}`}>Select & Book</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
