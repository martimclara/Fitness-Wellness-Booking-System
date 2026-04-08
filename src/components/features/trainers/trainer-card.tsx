import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TrainerPublic } from "@/types"

export function TrainerCard({ trainer }: { trainer: TrainerPublic }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={trainer.photo ?? undefined} />
            <AvatarFallback className="text-lg">
              {trainer.name?.charAt(0)?.toUpperCase() ?? "T"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{trainer.name}</h3>
            <p className="text-sm text-muted-foreground">
              {trainer.yearsExperience} years experience
            </p>
          </div>
        </div>

        {trainer.bio && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {trainer.bio}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {trainer.specialties.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        {trainer.services.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {trainer.services.length} service{trainer.services.length !== 1 ? "s" : ""} available
          </p>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link href={`/trainers/${trainer.id}`}>View Profile & Book</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
