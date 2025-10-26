import { Card, CardContent } from "@/components/ui/card"
import { SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Settings</p>
          <p className="text-sm text-muted-foreground">Settings panel coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}
