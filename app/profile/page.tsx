"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import {
  User,
  Wallet,
  Ticket,
  Settings,
  LogOut,
  Copy,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react"

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface UserProfile {
  id: string
  username: string
  email: string
  wallet_address: string
  avatar_url: string
  created_at: string
  bio: string
}

interface UserTicket {
  id: string
  event_id: string
  event_name: string
  event_date: string
  event_location: string
  event_image_url: string
  ticket_type: string
  purchase_date: string
  price: number
  status: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true)

        // Fetch user profile
        // In a real app, you would get the user ID from auth
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", "current_user_id") // Replace with actual user ID logic
          .single()

        if (profileError) {
          // For demo purposes, create mock profile data
          setProfile({
            id: "1",
            username: "johndoe",
            email: "john.doe@example.com",
            wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
            avatar_url: "/placeholder.svg?height=128&width=128",
            created_at: new Date().toISOString(),
            bio: "Blockchain enthusiast and avid concert-goer. Love discovering new artists and experiences.",
          })
        } else {
          setProfile(profileData)
        }

        // Fetch user tickets with event data
        const { data: ticketsData, error: ticketsError } = await supabase
          .from("tickets")
          .select(`
            *,
            event_data:event_id (
              name,
              date,
              location,
              image_url
            )
          `)
          .eq("owner_address", "user_wallet_address") // Replace with actual wallet address

        if (ticketsError) {
          // For demo purposes, create mock tickets data
          setTickets([
            {
              id: "t1",
              event_id: "e1",
              event_name: "Summer Music Festival",
              event_date: "2023-07-15",
              event_location: "Central Park, New York",
              event_image_url: "/placeholder.svg?height=200&width=300",
              ticket_type: "VIP",
              purchase_date: "2023-06-01",
              price: 150,
              status: "active",
            },
            {
              id: "t2",
              event_id: "e2",
              event_name: "Tech Conference 2023",
              event_date: "2023-09-22",
              event_location: "Convention Center, San Francisco",
              event_image_url: "/placeholder.svg?height=200&width=300",
              ticket_type: "Standard",
              purchase_date: "2023-08-15",
              price: 75,
              status: "active",
            },
            {
              id: "t3",
              event_id: "e3",
              event_name: "Basketball Championship",
              event_date: "2023-04-10",
              event_location: "Sports Arena, Chicago",
              event_image_url: "/placeholder.svg?height=200&width=300",
              ticket_type: "Premium",
              purchase_date: "2023-03-20",
              price: 120,
              status: "used",
            },
          ])
        } else {
          // Transform the tickets data
          const transformedTickets: UserTicket[] = ticketsData.map((ticket) => ({
            id: ticket.id,
            event_id: ticket.event_id,
            event_name: ticket.event_data.name,
            event_date: ticket.event_data.date,
            event_location: ticket.event_data.location,
            event_image_url: ticket.event_data.image_url,
            ticket_type: ticket.ticket_type,
            purchase_date: ticket.purchase_date,
            price: ticket.price,
            status: ticket.status,
          }))

          setTickets(transformedTickets)
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const copyToClipboard = () => {
    if (profile) {
      navigator.clipboard.writeText(profile.wallet_address)
      setCopied(true)
      toast({
        title: "Wallet Address Copied",
        description: "The wallet address has been copied to your clipboard.",
      })

      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't find your profile information. Please sign in or create an account.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Sort tickets by date (newest first)
  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime(),
  )

  // Separate active and past tickets
  const activeTickets = sortedTickets.filter((ticket) => ticket.status === "active")
  const pastTickets = sortedTickets.filter((ticket) => ticket.status === "used")

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 mb-4">
                    <Image
                      src={profile.avatar_url || "/placeholder.svg?height=96&width=96"}
                      alt={profile.username}
                      fill
                      className="rounded-full object-cover border-4 border-background"
                    />
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">{profile.username}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{profile.email}</p>
                  <Badge variant="outline" className="mb-4">
                    NFT Collector
                  </Badge>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <button
                    className={`flex items-center px-4 py-2 text-sm ${activeTab === "overview" ? "bg-muted font-medium" : ""}`}
                    onClick={() => setActiveTab("overview")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Overview
                  </button>
                  <button
                    className={`flex items-center px-4 py-2 text-sm ${activeTab === "tickets" ? "bg-muted font-medium" : ""}`}
                    onClick={() => setActiveTab("tickets")}
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    My Tickets
                  </button>
                  <button
                    className={`flex items-center px-4 py-2 text-sm ${activeTab === "wallet" ? "bg-muted font-medium" : ""}`}
                    onClick={() => setActiveTab("wallet")}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Wallet
                  </button>
                  <button
                    className={`flex items-center px-4 py-2 text-sm ${activeTab === "settings" ? "bg-muted font-medium" : ""}`}
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                </nav>
              </CardContent>
              <CardFooter className="pt-3">
                <Button variant="outline" className="w-full" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Overview</CardTitle>
                  <CardDescription>Your account information and recent activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="font-medium">{profile.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {new Date(profile.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet</p>
                        <p className="font-medium font-mono text-xs truncate">
                          {profile.wallet_address.substring(0, 6)}...
                          {profile.wallet_address.substring(profile.wallet_address.length - 4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Recent Tickets</h3>
                    {sortedTickets.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedTickets.slice(0, 4).map((ticket) => (
                          <Link href={`/tickets/${ticket.id}`} key={ticket.id}>
                            <div className="border rounded-lg overflow-hidden hover:border-primary transition-colors">
                              <div className="relative h-32 w-full">
                                <Image
                                  src={ticket.event_image_url || "/placeholder.svg?height=128&width=256"}
                                  alt={ticket.event_name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant={ticket.status === "active" ? "default" : "secondary"}>
                                    {ticket.status === "active" ? "Active" : "Used"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="font-medium truncate">{ticket.event_name}</h4>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(ticket.event_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs font-medium">{ticket.ticket_type}</span>
                                  <span className="text-xs">${ticket.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted/50 rounded-lg">
                        <Ticket className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">You don't have any tickets yet</p>
                        <Button variant="outline" className="mt-4" asChild>
                          <Link href="/events">Browse Events</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
                {sortedTickets.length > 4 && (
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("tickets")}>
                      View All Tickets
                    </Button>
                  </CardFooter>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold">{tickets.length}</p>
                      <p className="text-sm text-muted-foreground">Total Tickets</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold">{activeTickets.length}</p>
                      <p className="text-sm text-muted-foreground">Upcoming Events</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold">{pastTickets.length}</p>
                      <p className="text-sm text-muted-foreground">Past Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "tickets" && (
            <Card>
              <CardHeader>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>View all your purchased tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList className="mb-4">
                    <TabsTrigger value="active">Active Tickets</TabsTrigger>
                    <TabsTrigger value="past">Past Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    {activeTickets.length > 0 ? (
                      <div className="space-y-4">
                        {activeTickets.map((ticket) => (
                          <div key={ticket.id} className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-4">
                              <div className="relative h-32 md:h-full">
                                <Image
                                  src={ticket.event_image_url || "/placeholder.svg?height=128&width=256"}
                                  alt={ticket.event_name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="p-4 md:col-span-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <h3 className="font-semibold text-lg">{ticket.event_name}</h3>
                                  <Badge className="mt-1 md:mt-0 w-fit">{ticket.ticket_type}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>
                                      {new Date(ticket.event_date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>7:00 PM</span> {/* Placeholder time */}
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span className="truncate">{ticket.event_location}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Purchase Date: {new Date(ticket.purchase_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm font-medium">${ticket.price.toFixed(2)}</p>
                                  </div>
                                  <Button className="mt-2 md:mt-0" asChild>
                                    <Link href={`/tickets/${ticket.id}`}>View Ticket</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/50 rounded-lg">
                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-1">No Active Tickets</h3>
                        <p className="text-muted-foreground mb-4">You don't have any upcoming events</p>
                        <Button asChild>
                          <Link href="/events">Browse Events</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past">
                    {pastTickets.length > 0 ? (
                      <div className="space-y-4">
                        {pastTickets.map((ticket) => (
                          <div key={ticket.id} className="border rounded-lg overflow-hidden opacity-80">
                            <div className="grid grid-cols-1 md:grid-cols-4">
                              <div className="relative h-32 md:h-full">
                                <Image
                                  src={ticket.event_image_url || "/placeholder.svg?height=128&width=256"}
                                  alt={ticket.event_name}
                                  fill
                                  className="object-cover grayscale"
                                />
                              </div>
                              <div className="p-4 md:col-span-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <h3 className="font-semibold text-lg">{ticket.event_name}</h3>
                                  <Badge variant="outline" className="mt-1 md:mt-0 w-fit">
                                    {ticket.ticket_type}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>
                                      {new Date(ticket.event_date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span className="truncate">{ticket.event_location}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Badge variant="secondary" className="text-xs">
                                      Used
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Purchase Date: {new Date(ticket.purchase_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm font-medium">${ticket.price.toFixed(2)}</p>
                                  </div>
                                  <Button variant="outline" className="mt-2 md:mt-0" asChild>
                                    <Link href={`/tickets/${ticket.id}`}>View Details</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/50 rounded-lg">
                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-1">No Past Events</h3>
                        <p className="text-muted-foreground">You haven't attended any events yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {activeTab === "wallet" && (
            <Card>
              <CardHeader>
                <CardTitle>Wallet Information</CardTitle>
                <CardDescription>Manage your blockchain wallet and NFT tickets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Connected Wallet</h3>
                      <p className="text-sm text-muted-foreground">Ethereum Network</p>
                    </div>
                    <Badge variant="outline" className="mt-2 md:mt-0 w-fit">
                      Connected
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-background rounded border">
                    <div className="font-mono text-sm break-all">{profile.wallet_address}</div>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">NFT Tickets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{ticket.event_name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            NFT
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Token ID: #{ticket.id.substring(0, 8)}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{ticket.ticket_type}</span>
                          <Button variant="outline" size="sm" className="h-8" asChild>
                            <Link
                              href={`https://etherscan.io/token/${ticket.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View on Chain
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">Transaction History</h3>
                  <div className="border rounded-lg divide-y">
                    {tickets.slice(0, 5).map((ticket, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{ticket.event_name} Ticket</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ticket.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${ticket.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Profile Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your account information and how we contact you
                    </p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Username</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            value={profile.username}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <input
                            type="email"
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            value={profile.email}
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                          rows={3}
                          value={profile.bio}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground mb-4">Control when and how you receive notifications</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive emails about your account activity</p>
                        </div>
                        <div className="h-6 w-11 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 bg-white h-4 w-4 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Event Reminders</p>
                          <p className="text-sm text-muted-foreground">Get reminded about upcoming events</p>
                        </div>
                        <div className="h-6 w-11 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 bg-white h-4 w-4 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Communications</p>
                          <p className="text-sm text-muted-foreground">Receive updates about new events and offers</p>
                        </div>
                        <div className="h-6 w-11 bg-muted rounded-full relative cursor-pointer">
                          <div className="absolute left-1 top-1 bg-muted-foreground h-4 w-4 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
