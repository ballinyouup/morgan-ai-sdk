import { Card, CardContent } from "@/components/ui/card"
import { SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Glassy header section */}
      <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and application preferences</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
        <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SettingsIcon className="h-12 w-12 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250 mb-4" />
            <p className="text-lg font-medium text-white">Settings</p>
            <p className="text-sm text-gray-400">Settings panel coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
