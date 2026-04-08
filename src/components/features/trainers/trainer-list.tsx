"use client"

import { useEffect, useState } from "react"
import { TrainerCard } from "./trainer-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { TrainerPublic } from "@/types"
import { Search } from "lucide-react"

export function TrainerList() {
  const [trainers, setTrainers] = useState<TrainerPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)

  useEffect(() => {
    const url = selectedSpecialty
      ? `/api/trainers?specialty=${encodeURIComponent(selectedSpecialty)}`
      : "/api/trainers"
    fetch(url)
      .then((r) => r.json())
      .then(setTrainers)
      .finally(() => setLoading(false))
  }, [selectedSpecialty])

  const allSpecialties = [
    ...new Set(trainers.flatMap((t) => t.specialties)),
  ].sort()

  const filtered = trainers.filter(
    (t) =>
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.specialties.some((s) =>
        s.toLowerCase().includes(search.toLowerCase())
      )
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {allSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedSpecialty === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedSpecialty(null)}
          >
            All
          </Badge>
          {allSpecialties.map((s) => (
            <Badge
              key={s}
              variant={selectedSpecialty === s ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedSpecialty(s === selectedSpecialty ? null : s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No trainers found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>
      )}
    </div>
  )
}
