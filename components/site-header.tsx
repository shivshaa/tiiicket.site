"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useWallet } from "@/components/wallet-provider"
import { Wallet, Ticket, Menu } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function SiteHeader() {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Ticket className="h-6 w-6 animate-bounce" />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-ping" />
            </div>
            <span className="font-bold">WebIsGrey</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/music" className="text-sm font-medium transition-colors hover:text-primary">
              Music
            </Link>
            <Link href="/sports" className="text-sm font-medium transition-colors hover:text-primary">
              Sports
            </Link>
            <Link href="/marketplace" className="text-sm font-medium transition-colors hover:text-primary">
              Marketplace
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden md:inline-block">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tickets">My Tickets</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/organizer/dashboard">Organizer Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet}>Disconnect</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={connectWallet} disabled={isConnecting}>
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 pt-6">
                <Link href="/music" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                  Music
                </Link>
                <Link href="/sports" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                  Sports
                </Link>
                <Link href="/marketplace" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                  Marketplace
                </Link>
                {isConnected && (
                  <>
                    <Link href="/profile" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                      Profile
                    </Link>
                    <Link href="/tickets" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                      My Tickets
                    </Link>
                    <Link href="/organizer/dashboard" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                      Organizer Dashboard
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

