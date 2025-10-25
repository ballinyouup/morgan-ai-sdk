"use client"

import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-lg px-6">
      <div className="flex-1">
        <form className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            type="search" 
            placeholder="Search cases, clients, or documents..." 
            className="pl-8 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-yellow-300/50 focus:ring-yellow-300/20" 
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-yellow-300 hover:bg-gray-700/50">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 hover:bg-red-600"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-yellow-300 hover:bg-gray-700/50">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuLabel className="text-white">Emily Rodriguez</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-xs text-gray-400">Paralegal</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-yellow-300">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-yellow-300">Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-red-400">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
