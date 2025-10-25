"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderOpen, CheckSquare, MessageSquare, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FolderOpen },
  { href: "/actions", label: "Agent Actions", icon: CheckSquare },
  { href: "/communications", label: "Communications", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <div key={item.href} className="relative group">
            {/* Hover effect background */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <Link
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-yellow-300/20 text-yellow-300 border border-yellow-300/30"
                  : "text-gray-300 hover:text-yellow-300 hover:bg-gray-700/50",
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-all duration-200",
                isActive 
                  ? "text-yellow-300" 
                  : "text-gray-400 group-hover:text-yellow-300 group-hover:scale-110"
              )} />
              {item.label}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
