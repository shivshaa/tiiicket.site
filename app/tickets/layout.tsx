import type React from "react"
import "../globals.css"
import "./tickets.css"

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}
