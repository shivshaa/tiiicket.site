"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Store, Landmark, Wallet, Menu, Compass, ShoppingCart, User, LogOut, Settings, Ticket, TicketCheck } from "lucide-react"
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
import { supabase } from "@/lib/supabase"

interface UserProfile {
  username: string
  email: string
  wallet_address: string
}

export function SiteHeader() {
  const { address, isConnected } = useWallet()
  const { user, isAuthenticated, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch user profile when wallet is connected
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!address || !isConnected) {
        setUserProfile(null)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("user_data")
          .select("username, email, wallet_address")
          .eq("wallet_address", address.toLowerCase())
          .single()

        if (error) {
          console.log("User profile not found, using wallet address")
          setUserProfile(null)
        } else {
          setUserProfile(data)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [address, isConnected])

  const currentTheme = theme === "system" ? systemTheme : theme

  const logoSrc =
    currentTheme === "dark"
      ? "https://res.cloudinary.com/deximageapi/image/upload/v1747073795/tiiicket-black-removebg-preview_emy3ex.png"
      : "https://res.cloudinary.com/deximageapi/image/upload/v1746777300/tiiicket-white_l64f6g.png"

  const [isOpen, setIsOpen] = useState(false)

  const getDisplayName = () => {
    if (loading) return "Loading..."
    if (userProfile?.username) return userProfile.username
    if (user?.username) return user.username
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`
    return "Account"
  }

  const navigationItems = [
    {
      icon: Compass,
      label: "Events",
      href: "#",
      submenu: [
        { label: "Music", href: "/music" },
        { label: "Sports", href: "/sports" }
      ],
      gradient: "from-green-500 to-violet-600"
    },
    {
      icon: Store,
      label: "Market",
      href: "/market",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Landmark,
      label: "For Organizers",
      href: "/organizer/dashboard",
      gradient: "from-orange-500 to-red-600"
    }
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5' 
          : 'bg-transparent'
      }`}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-md" />
      
      <div className="relative container mx-auto px-4 lg:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center group">
            <Link href="/" className="flex items-center transition-transform duration-300 group-hover:scale-105">
              <div className="relative overflow-hidden rounded-xl p-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {mounted && (
                  <div className="flex items-center gap-2 relative z-10">
                    {/* Glowing TicketCheck Icon */}
                    <div className="relative w-fit">
                      {/* Gold-Orange Glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-300 blur-xl opacity-50 z-0" />

                      {/* Sparkle Dots */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-200 rounded-full z-10"
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-orange-300 rounded-full z-10"
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      />

                      {/* Animated Icon */}
                      <motion.div
                        animate={{ y: [0, -4, 0], rotate: [0, 4, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-20"
                      >
                        <TicketCheck className="h-8 w-8 text-yellow-300 drop-shadow-md" />
                      </motion.div>
                    </div>

                    {/* Logo Image */}
                    <Image 
                      src={logoSrc || "/placeholder.svg"} 
                      alt="tiiicket logo" 
                      width={140} 
                      height={40} 
                      priority 
                      className="transition-all duration-300"
                    />
                  </div>
                )}
              </div>
            </Link>
          </div>





          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-8">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-2xl border border-border/50 backdrop-blur-sm">
              {navigationItems.map((item, index) => (
                <div key={item.label} className="relative group">
                  {item.submenu ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="relative flex flex-col items-center gap-1 px-4 py-3 h-auto rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-teal-500/20 hover:shadow-lg hover:shadow-emerald-500/25 group-hover:scale-105"
                        >
                          <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                          <span className="text-xs font-medium">{item.label}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="mt-2 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl">
                        {item.submenu.map((subItem) => (
                          <DropdownMenuItem key={subItem.label} asChild>
                            <Link 
                              href={subItem.href}
                              className="transition-colors duration-200 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10"
                            >
                              {subItem.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      className={`relative flex flex-col items-center gap-1 px-4 py-3 h-auto rounded-xl transition-all duration-300 group hover:scale-105 ${
                        item.gradient 
                          ? `hover:bg-gradient-to-r hover:${item.gradient}/20 hover:shadow-lg hover:shadow-${item.gradient.split('-')[1]}-500/25`
                          : 'hover:bg-muted/80'
                      }`}
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        <span className="text-xs font-medium">{item.label}</span>
                        {item.gradient && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        )}
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <ModeToggle />
            
            {isConnected || isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="relative flex items-center gap-2 px-4 py-2 h-auto rounded-xl bg-gradient-to-r from-background to-muted/50 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-black/10 group"
                  >
                    <div className="relative">
                      <Wallet className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    </div>
                    <span className="hidden md:inline-block font-medium text-sm max-w-32 truncate">
                      {getDisplayName()}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 mt-2 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl"
                >
                  <DropdownMenuLabel className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 transition-colors duration-200 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets" className="flex items-center gap-2 transition-colors duration-200 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10">
                      <Ticket className="h-4 w-4" />
                      My Tickets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/organizer/dashboard" className="flex items-center gap-2 transition-colors duration-200 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10">
                      <Landmark className="h-4 w-4" />
                      Organizer Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl hover:bg-muted/80 transition-all duration-300 hover:scale-105" 
                  asChild
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button 
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105" 
                  asChild
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden rounded-xl hover:bg-muted/80 transition-all duration-300 hover:scale-105"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-xl border-l border-border/50">
                <div className="flex flex-col gap-6 pt-8">
                  <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Navigation
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Link 
                      href="/music" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 transition-all duration-300 group" 
                      onClick={() => setIsOpen(false)}
                    >
                      <Compass className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium">Music Events</span>
                    </Link>
                    <Link 
                      href="/sports" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 transition-all duration-300 group" 
                      onClick={() => setIsOpen(false)}
                    >
                      <Compass className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium">Sports Events</span>
                    </Link>
                    <Link 
                      href="/market" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 group" 
                      onClick={() => setIsOpen(false)}
                    >
                      <Store className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium">Marketplace</span>
                    </Link>
                  </div>

                  <div className="border-t border-border/50 pt-6">
                    {!isConnected && !isAuthenticated ? (
                      <div className="flex flex-col gap-3">
                        <Link 
                          href="/sign-in" 
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-all duration-300" 
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="font-medium">Sign In</span>
                        </Link>
                        <Link 
                          href="/sign-up" 
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300" 
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="font-medium">Get Started</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 group" 
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">Profile</span>
                        </Link>
                        <Link 
                          href="/tickets" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 transition-all duration-300 group" 
                          onClick={() => setIsOpen(false)}
                        >
                          <Ticket className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">My Tickets</span>
                        </Link>
                        <Link 
                          href="/organizer/dashboard" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10 transition-all duration-300 group" 
                          onClick={() => setIsOpen(false)}
                        >
                          <Landmark className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">Organizer Dashboard</span>
                        </Link>
                        <button 
                          onClick={() => { signOut(); setIsOpen(false); }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all duration-300 group text-left"
                        >
                          <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

// Default export for compatibility
export default SiteHeader
