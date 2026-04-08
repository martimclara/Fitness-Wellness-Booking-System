"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"

type ScheduleEntry = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function TrainerSchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/trainer/schedule")
      .then((r) => r.json())
      .then((data: ScheduleEntry[]) => {
        setEntries(data)
        setLoading(false)
      })
  }, [])

  function addEntry() {
    setEntries([...entries, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true }])
  }

  function updateEntry(index: number, field: keyof ScheduleEntry, value: string | number | boolean) {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    setEntries(updated)
  }

  function removeEntry(index: number) {
    setEntries(entries.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/trainer/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    })

    if (res.ok) {
      const data = await res.json()
      setEntries(data)
      toast.success("Schedule saved")
    } else {
      toast.error("Failed to save schedule")
    }
    setSaving(false)
  }

  // Group entries by day for display
  const entriesByDay = dayNames.map((name, dayIndex) => ({
    name,
    dayIndex,
    slots: entries
      .map((e, originalIndex) => ({ ...e, originalIndex }))
      .filter((e) => e.dayOfWeek === dayIndex),
  }))

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">My Schedule</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground mt-1">Set your weekly recurring availability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {entriesByDay.map((day) => (
          <Card key={day.dayIndex}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {day.name}
                {day.slots.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{day.slots.length} slot{day.slots.length !== 1 ? "s" : ""}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            {day.slots.length > 0 && (
              <CardContent className="space-y-3">
                {day.slots.map((slot) => (
                  <div key={slot.originalIndex} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-10">From</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateEntry(slot.originalIndex, "startTime", e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-6">To</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateEntry(slot.originalIndex, "endTime", e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntry(slot.originalIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            )}
            {day.slots.length === 0 && (
              <CardContent>
                <p className="text-sm text-muted-foreground">No availability set</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
