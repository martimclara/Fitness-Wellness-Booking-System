import { Dumbbell } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Dumbbell className="h-4 w-4" />
            FitBook &copy; {new Date().getFullYear()}
          </div>
          <p className="text-sm text-muted-foreground">
            Fitness & Wellness Booking Platform
          </p>
        </div>
      </div>
    </footer>
  )
}
