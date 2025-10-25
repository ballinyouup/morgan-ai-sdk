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
      <body className={`font-sans antialiased`}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-card">
            <div className="flex h-16 items-center border-b px-6">
              <h2 className="text-lg font-semibold">SimplyLaw</h2>
            </div>
            <DashboardNav />
          </aside>

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
