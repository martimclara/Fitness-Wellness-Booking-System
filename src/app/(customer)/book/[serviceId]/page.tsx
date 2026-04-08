"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCents } from "@/lib/utils"
import { Clock } from "lucide-react"

type ServiceDetail = {
  id: string
  name: string
  description: string | null
  type: string
  durationMinutes: number
  price: number
  maxParticipants: number
  trainers: {
    trainerProfile: {
      id: string
      bio: string | null
      specialties: string[]
      user: { name: string; image: string | null }
    }
  }[]
}

export default function ServiceBookPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [service, setService] = useState<ServiceDetail | null>(null)

  useEffect(() => {
    fetch(`/api/services/${serviceId}`)
      .then((r) => r.json())
      .then(setService)
  }, [serviceId])

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{service.name}</h1>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {service.durationMinutes} min
          </span>
          <span className="font-semibold text-foreground">
            {formatCents(service.price)}
          </span>
        </div>
        {service.description && (
          <p className="mt-4 text-muted-foreground">{service.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose a Trainer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.trainers.map(({ trainerProfile: tp }) => (
              <Link
                key={tp.id}
                href={`/trainers/${tp.id}`}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={tp.user.image ?? undefined} />
                  <AvatarFallback>
                    {tp.user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{tp.user.name}</p>
                  {tp.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {tp.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tp.specialties.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
