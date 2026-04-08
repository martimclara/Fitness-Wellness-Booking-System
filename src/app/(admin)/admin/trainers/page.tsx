"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { toast } from "sonner"

type AdminTrainer = {
  id: string
  bio: string | null
  photo: string | null
  specialties: string[]
  certifications: string[]
  yearsExperience: number
  isActive: boolean
  user: { id: string; name: string; email: string; image: string | null }
  services: { service: { id: string; name: string } }[]
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<AdminTrainer[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    specialties: "",
    certifications: "",
    yearsExperience: 0,
  })

  function loadTrainers() {
    fetch("/api/admin/trainers")
      .then((r) => r.json())
      .then(setTrainers)
  }

  useEffect(() => { loadTrainers() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    })

    if (res.ok) {
      toast.success("Trainer created")
      setOpen(false)
      setForm({ name: "", email: "", bio: "", specialties: "", certifications: "", yearsExperience: 0 })
      loadTrainers()
    } else {
      toast.error("Failed to create trainer")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trainers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Trainer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tname">Name</Label>
                  <Input id="tname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temail">Email</Label>
                  <Input id="temail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tbio">Bio</Label>
                <Textarea id="tbio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tspec">Specialties (comma-separated)</Label>
                <Input id="tspec" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Yoga, HIIT, Strength" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcert">Certifications (comma-separated)</Label>
                <Input id="tcert" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} placeholder="ACE, NASM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="texp">Years Experience</Label>
                <Input id="texp" type="number" value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })} min={0} />
              </div>
              <Button type="submit" className="w-full">Create Trainer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainers.map((trainer) => (
          <Card key={trainer.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={trainer.photo ?? trainer.user.image ?? undefined} />
                  <AvatarFallback>{trainer.user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{trainer.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{trainer.user.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {trainer.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {trainer.yearsExperience} years exp. &middot;{" "}
                    {trainer.services.length} service{trainer.services.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge variant={trainer.isActive ? "default" : "secondary"}>
                  {trainer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
