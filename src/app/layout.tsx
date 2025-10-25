import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardHeader } from "@/components/dashboard-header"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SimplyLaw - Case Management",
  description: "AI-powered case management system for paralegals",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-gray-900`}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-800/50 backdrop-blur-lg border-r border-gray-700/50">
            <div className="flex h-16 items-center border-b border-gray-700/50 px-6">
              <h2 className="text-lg font-semibold text-white">SimplyLaw</h2>
            </div>
            <DashboardNav />
          </aside>

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto bg-gray-900/95 backdrop-blur-sm">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
