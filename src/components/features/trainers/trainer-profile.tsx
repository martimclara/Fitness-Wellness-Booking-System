"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Clock, Star } from "lucide-react"
import type { TrainerPublic } from "@/types"
import { formatCents } from "@/lib/utils"

export function TrainerProfileView({ trainer }: { trainer: TrainerPublic }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={trainer.photo ?? undefined} />
          <AvatarFallback className="text-2xl">
            {trainer.name?.charAt(0)?.toUpperCase() ?? "T"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{trainer.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {trainer.yearsExperience} years experience
            </span>
          </div>
          {trainer.bio && (
            <p className="mt-4 text-muted-foreground max-w-2xl">
              {trainer.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {trainer.specialties.map((s) => (
          <Badge key={s} variant="secondary">
            {s}
          </Badge>
        ))}
      </div>

      {trainer.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {trainer.certifications.map((c) => (
                <li key={c} className="text-sm text-muted-foreground">
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Services Offered</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainer.services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.durationMinutes} min
                  </p>
                </div>
                <p className="font-semibold">{formatCents(service.price)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
