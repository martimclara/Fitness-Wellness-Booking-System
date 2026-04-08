"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Timezone</p>
              <p className="font-medium">Europe/Lisbon (WET/WEST)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">EUR</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Provider</p>
              <p className="font-medium">Stripe</p>
            </div>
            <div>
              <p className="text-muted-foreground">Notification Channels</p>
              <div className="flex gap-1 mt-0.5">
                <Badge variant="secondary">Email (Resend)</Badge>
                <Badge variant="secondary">SMS (Twilio)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>&gt; 24 hours before session: <span className="font-medium">Full refund</span></p>
            <p>12-24 hours before session: <span className="font-medium">50% refund</span></p>
            <p>&lt; 12 hours before session: <span className="font-medium">No refund</span></p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Stripe</p>
                <p className="text-muted-foreground">Payment processing</p>
              </div>
              <Badge variant={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "default" : "secondary"}>
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Connected" : "Not configured"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Resend</p>
                <p className="text-muted-foreground">Email notifications</p>
              </div>
              <Badge variant="secondary">Configure in .env</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Twilio</p>
                <p className="text-muted-foreground">SMS notifications</p>
              </div>
              <Badge variant="secondary">Configure in .env</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
