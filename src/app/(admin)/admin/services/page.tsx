"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCents } from "@/lib/utils"
import { Plus, Clock, Users } from "lucide-react"
import { toast } from "sonner"

type AdminService = {
  id: string
  name: string
  description: string | null
  type: string
  durationMinutes: number
  price: number
  maxParticipants: number
  isActive: boolean
  trainers: { trainerProfile: { user: { name: string } } }[]
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "PERSONAL" as string,
    durationMinutes: 60,
    price: 5000,
    maxParticipants: 1,
  })

  function loadServices() {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then(setServices)
  }

  useEffect(() => { loadServices() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      toast.success("Service created")
      setOpen(false)
      setForm({ name: "", description: "", type: "PERSONAL", durationMinutes: 60, price: 5000, maxParticipants: 1 })
      loadServices()
    } else {
      toast.error("Failed to create service")
    }
  }

  const typeLabels: Record<string, string> = {
    CLASS: "Group Class",
    PERSONAL: "Personal Training",
    STUDIO: "Studio Booking",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Services</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? "PERSONAL" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONAL">Personal Training</SelectItem>
                      <SelectItem value="CLASS">Group Class</SelectItem>
                      <SelectItem value="STUDIO">Studio Booking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dur">Duration (min)</Label>
                  <Input
                    id="dur"
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    min={15}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (cents EUR)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max Participants</Label>
                  <Input
                    id="max"
                    type="number"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Create Service</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {typeLabels[service.type]}
                  </Badge>
                </div>
                <span className="font-bold">{formatCents(service.price)}</span>
              </div>
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
              <p className="text-xs text-muted-foreground">
                {service.trainers.length} trainer{service.trainers.length !== 1 ? "s" : ""} assigned
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
