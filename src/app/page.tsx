import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Users, Calendar, CreditCard } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Expert Trainers",
    description: "Browse certified trainers by specialty and book directly.",
  },
  {
    icon: Calendar,
    title: "Easy Scheduling",
    description: "View real-time availability and book in seconds.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Pay online with Stripe. Flexible cancellation policy.",
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Dumbbell className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Book Your Next
            <br />
            <span className="text-primary">Fitness Session</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect trainer, pick a time that works for you, and start
            your wellness journey today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/trainers">Browse Trainers</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/book">Book a Session</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
