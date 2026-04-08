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
import { Plus, Pencil, Trash2, ShieldOff, ShieldCheck, KeyRound, UserX } from "lucide-react"
import { toast } from "sonner"

type AdminTrainer = {
  id: string
  bio: string | null
  photo: string | null
  specialties: string[]
  certifications: string[]
  yearsExperience: number
  isActive: boolean
  user: { id: string; name: string; email: string; image: string | null; isBlocked: boolean }
  services: { service: { id: string; name: string } }[]
}

const emptyForm = {
  name: "",
  email: "",
  bio: "",
  specialties: "",
  certifications: "",
  yearsExperience: 0,
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<AdminTrainer[]>([])
  const [open, setOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<AdminTrainer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)

  function loadTrainers() {
    fetch("/api/admin/trainers")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
        return data
      })
      .then(setTrainers)
      .catch((err) => toast.error(String(err.message ?? err)))
  }

  useEffect(() => { loadTrainers() }, [])

  function openCreate() {
    setEditingTrainer(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(trainer: AdminTrainer) {
    setEditingTrainer(trainer)
    setForm({
      name: trainer.user.name ?? "",
      email: trainer.user.email,
      bio: trainer.bio ?? "",
      specialties: trainer.specialties.join(", "),
      certifications: trainer.certifications.join(", "),
      yearsExperience: trainer.yearsExperience,
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
    }

    const url = editingTrainer
      ? `/api/admin/trainers/${editingTrainer.id}`
      : "/api/admin/trainers"
    const method = editingTrainer ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      if (!editingTrainer && data.tempPassword) {
        setCreatedCredentials({ email: form.email, password: data.tempPassword })
      }
      toast.success(editingTrainer ? "Trainer updated" : "Trainer created")
      setOpen(false)
      setEditingTrainer(null)
      setForm(emptyForm)
      loadTrainers()
    } else {
      toast.error(editingTrainer ? "Failed to update trainer" : "Failed to create trainer")
    }
  }

  async function handleDeactivate(trainer: AdminTrainer) {
    if (!confirm(`Deactivate ${trainer.user.name}? They will no longer appear in public listings.`)) return

    const res = await fetch(`/api/admin/trainers/${trainer.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Trainer deactivated")
      loadTrainers()
    } else {
      toast.error("Failed to deactivate trainer")
    }
  }

  async function handleToggleBlock(trainer: AdminTrainer) {
    const blocking = !trainer.user.isBlocked
    const action = blocking ? "block" : "unblock"
    if (!confirm(`${blocking ? "Block" : "Unblock"} ${trainer.user.name}? ${blocking ? "They will not be able to log in." : "They will be able to log in again."}`)) return

    const res = await fetch(`/api/admin/users/${trainer.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: blocking }),
    })

    if (res.ok) {
      toast.success(`Trainer ${action}ed`)
      loadTrainers()
    } else {
      toast.error(`Failed to ${action} trainer`)
    }
  }

  async function handleResetPassword(trainer: AdminTrainer) {
    if (!confirm(`Reset password for ${trainer.user.name}? A new temporary password will be generated.`)) return

    const res = await fetch(`/api/admin/users/${trainer.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    })

    if (res.ok) {
      const data = await res.json()
      setCreatedCredentials({ email: trainer.user.email, password: data.tempPassword })
      toast.success("Password reset successfully")
    } else {
      toast.error("Failed to reset password")
    }
  }

  async function handleDeleteUser(trainer: AdminTrainer) {
    if (!confirm(`PERMANENTLY DELETE ${trainer.user.name} and all their data? This cannot be undone.`)) return
    if (!confirm(`Are you sure? This will delete the user account, trainer profile, schedules, and all associated data.`)) return

    const res = await fetch(`/api/admin/users/${trainer.user.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Trainer permanently deleted")
      loadTrainers()
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Failed to delete trainer")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trainers</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingTrainer(null) }}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add Trainer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrainer ? "Edit Trainer" : "New Trainer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full">
                {editingTrainer ? "Save Changes" : "Create Trainer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials dialog */}
      <Dialog open={!!createdCredentials} onOpenChange={(v) => { if (!v) setCreatedCredentials(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trainer Login Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the trainer. They should change the password after first login.
            </p>
            <div className="space-y-2 rounded-md bg-muted p-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-mono text-sm font-medium">{createdCredentials?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                <p className="font-mono text-sm font-medium">{createdCredentials?.password}</p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${createdCredentials?.email}\nPassword: ${createdCredentials?.password}`
                )
                toast.success("Credentials copied to clipboard")
              }}
            >
              Copy Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className={!trainer.isActive || trainer.user.isBlocked ? "opacity-60" : ""}>
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
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <Badge variant={trainer.isActive ? "default" : "secondary"}>
                      {trainer.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {trainer.user.isBlocked && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(trainer)}
                      title="Edit profile"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleBlock(trainer)}
                      title={trainer.user.isBlocked ? "Unblock login" : "Block login"}
                    >
                      {trainer.user.isBlocked
                        ? <ShieldCheck className="h-4 w-4 text-green-600" />
                        : <ShieldOff className="h-4 w-4 text-orange-500" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResetPassword(trainer)}
                      title="Reset password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {trainer.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeactivate(trainer)}
                        title="Deactivate (hide from listings)"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(trainer)}
                      title="Permanently delete account"
                    >
                      <UserX className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
