import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents } from "@/lib/utils"
import { Clock, User, Calendar } from "lucide-react"

interface BookingSummaryProps {
  trainerName: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
}

export function BookingSummary({
  trainerName,
  serviceName,
  date,
  time,
  duration,
  price,
}: BookingSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{trainerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {date} at {time}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {serviceName} ({duration} min)
          </span>
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCents(price)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
