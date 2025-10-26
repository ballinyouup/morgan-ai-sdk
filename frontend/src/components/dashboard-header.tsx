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

import Link from "next/link"

const userImageUrl = "/user.png"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b  px-6">
      <div className="h-full w-full z-[-1] absolute right-0 backdrop-blur-sm bg-black/10"></div>
      <div className="flex-1">
        <form className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
          <Input type="search" placeholder="Search cases, clients, or documents..." className="pl-8 text-white" />
        </form>
      </div>

      <div className="flex items-center gap-2 space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-white" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <img
                src={userImageUrl}
                className="h-10 w-10 rounded-sm object-cover object-center"
                alt="User avatar"
              />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Alex Reyes</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">Paralegal</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />

          
              <DropdownMenuItem><Link href="/">Log out</Link></DropdownMenuItem>
         

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
