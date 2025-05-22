"use client"

import Link from "next/link"
import Image from "next/image"
import { Store, Ticket, Landmark, Wallet, Menu, Compass, ShoppingCart } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useWallet } from "@/components/wallet-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export function SiteHeader() {
  const { address, isConnected, isConnecting, connectWallet } = useWallet()
  const { user, isAuthenticated, signOut } = useAuth()
  const router = useRouter()

  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === "system" ? systemTheme : theme

  const logoSrc =
    currentTheme === "dark"
      ? "https://res.cloudinary.com/deximageapi/image/upload/v1747073795/tiiicket-black-removebg-preview_emy3ex.png"
      : "https://res.cloudinary.com/deximageapi/image/upload/v1744465886/Screenshot_2025-04-12_192046-removebg-preview_ebhg42.png"

  const [isOpen, setIsOpen] = useState(false)

  // Handle wallet connection click
  const handleConnectWalletClick = async () => {
    await connectWallet()
  }

  // Handle sign out with proper state management and redirection
  const handleSignOut = async () => {
    try {
      await signOut()
      
      // Wait a short moment to ensure state updates are processed
      setTimeout(() => {
        // Redirect to home page
        router.push("/")
        
        // Force a full page reload to ensure all states are cleared
        // This is important to reset any React component state that might
        // still be showing authenticated UI elements
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Ticket className="h-10 w-10 text-black-400 animate-bounce drop-shadow-lg" />
          <Link href="/" className="flex items-center rounded-lg p-1 hover:shadow transition-shadow duration-300">
            <div className="relative group">
              {mounted && (
                <Image
                  className="transition-transform duration-300 group-hover:scale-105"
                  src={logoSrc || "/placeholder.svg"}
                  alt="tiiicket logo"
                  width={140}
                  height={90}
                  priority
                />
              )}
            </div>
          </Link>
        </div>


        <div className="hidden md:flex items-center justify-center flex-1 gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center h-auto py-2 transition-transform duration-300 group-hover:scale-105 hover:text-white"
              >
                <Compass className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">Events</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="/music">Music</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sports">Sports</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            className="flex flex-col items-center h-auto py-2 transition-transform duration-300 group-hover:scale-105 hover:text-white"
            asChild
          >
            <Link href="/market">
              <Store className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Market</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center h-auto py-2 transition-transform duration-300 group-hover:scale-105 hover:text-white"
            asChild
          >
            <Link href="/organizer/dashboard">
              <Landmark className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">For Organizers</span>
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          {isConnected || isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden md:inline-block">
                    {user?.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Account")}
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
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
              <Button
                onClick={handleConnectWalletClick}
                disabled={isConnecting}
                variant="outline"
                className="hidden md:flex"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
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
                <Link href="/market" className="flex items-center text-sm font-medium" onClick={() => setIsOpen(false)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Market
                </Link>
                {!isConnected && !isAuthenticated ? (
                  <>
                    <Link href="/sign-in" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                      Sign In
                    </Link>
                    <Link href="/sign-up" className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                      Sign Up
                    </Link>
                    <Button
                      onClick={() => {
                        handleConnectWalletClick()
                        setIsOpen(false)
                      }}
                      disabled={isConnecting}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  </>
                ) : (
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
                    <button onClick={handleSignOut} className="text-sm font-medium text-red-500">
                      Sign Out
                    </button>
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
