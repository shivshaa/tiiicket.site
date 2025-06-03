"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/components/wallet-provider"
import { useAuth } from "@/components/auth-provider"
import Image from "next/image"
import Link from "next/link"
import {
  User,
  Wallet,
  Ticket,
  LogOut,
  Copy,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface UserProfile {
  id: string
  username: string
  email: string
  wallet_address: string
  created_at: string
}

interface UserTicket {
  token_id: number
  event_id: string
  owner_address: string
  price: number
  category: string
  purchase_date: string
  seat_info: string
  event_name: string
  image_url: string
  for_sale: boolean
  resale_price: number | null
  event_data: {
    name: string
    date: string
    time: string
    location: string
    event_image_url: string
    category: string
  }
}

interface WalletInfo {
  address: string
  balance: string
  network: {
    chainId: string
    name: string
  }
}

export default function ProfilePage() {
  const { address, isConnected } = useWallet()
  const { signOut } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [copied, setCopied] = useState(false)

  // Get network name from chain ID
  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case "0x89":
        return "Polygon Mainnet"
      case "0x13882":
        return "Polygon Amoy Testnet"
      default:
        return "Unknown Network"
    }
  }

  // Get wallet balance
  const getWalletBalance = async (address: string): Promise<string> => {
    try {
      if (!window.ethereum) return "0"

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      // Convert from wei to ether
      const balanceInEther = Number.parseInt(balance, 16) / Math.pow(10, 18)
      return balanceInEther.toFixed(4)
    } catch (error) {
      console.error("Error getting balance:", error)
      return "0"
    }
  }

  // Get current network
  const getCurrentNetwork = async () => {
    try {
      if (!window.ethereum) return null

      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      return {
        chainId,
        name: getNetworkName(chainId),
      }
    } catch (error) {
      console.error("Error getting network:", error)
      return null
    }
  }

  // Fetch wallet information
  const fetchWalletInfo = async () => {
    if (!address || !isConnected) return

    try {
      const balance = await getWalletBalance(address)
      const network = await getCurrentNetwork()

      setWalletInfo({
        address,
        balance,
        network: network || { chainId: "unknown", name: "Unknown Network" },
      })
    } catch (error) {
      console.error("Error fetching wallet info:", error)
    }
  }

  // Fetch user profile from Supabase
  const fetchUserProfile = async () => {
    if (!address) return

    try {
      const { data, error } = await supabase
        .from("user_data")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .single()

      if (error) {
        console.log("User profile not found in database")
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setProfile(null)
    }
  }

  // Fetch user tickets from Supabase
  const fetchUserTickets = async () => {
    if (!address) return

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          token_id,
          event_id,
          owner_address,
          price,
          category,
          purchase_date,
          seat_info,
          event_name,
          image_url,
          for_sale,
          resale_price,
          event_data:event_id (
            name,
            date,
            time,
            location,
            event_image_url,
            category
          )
        `)
        .eq("owner_address", address.toLowerCase())
        .order("purchase_date", { ascending: false })

      if (error) {
        console.error("Error fetching tickets:", error)
        setTickets([])
      } else {
        setTickets(data || [])
      }
    } catch (error) {
      console.error("Error fetching user tickets:", error)
      setTickets([])
    }
  }

  // Load all data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!address || !isConnected) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        await Promise.all([fetchUserProfile(), fetchUserTickets(), fetchWalletInfo()])
      } catch (error) {
        console.error("Error loading profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [address, isConnected])

  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address)
      setCopied(true)
      toast({
        title: "Wallet Address Copied",
        description: "The wallet address has been copied to your clipboard.",
      })

      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Separate active and past tickets based on event date
  const now = new Date()
  const activeTickets = tickets.filter((ticket) => {
    if (!ticket.event_data?.date) return true
    return new Date(ticket.event_data.date) >= now
  })
  const pastTickets = tickets.filter((ticket) => {
    if (!ticket.event_data?.date) return false
    return new Date(ticket.event_data.date) < now
  })

  // Handle sign out
  const handleSignOut = () => {
    signOut()
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    })
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Connect your wallet to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sign-in">Connect Wallet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    )
  }

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
                      src="/placeholder.svg?height=96&width=96"
                      alt="Profile"
                      fill
                      className="rounded-full object-cover border-4 border-background"
                    />
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">{profile?.username || formatAddress(address)}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{profile?.email || "No email provided"}</p>
                  <Badge variant="outline" className="mb-4">
                    {walletInfo?.network.name || "Unknown Network"}
                  </Badge>
                  <p className="text-sm">
                    {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} owned
                  </p>
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
                </nav>
              </CardContent>
              <CardFooter className="pt-3">
                <Button variant="outline" className="w-full" size="sm" onClick={handleSignOut}>
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
                  <CardDescription>Your account information and wallet details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="font-medium">{profile?.username || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{profile?.email || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet Address</p>
                        <p className="font-medium font-mono text-xs">{formatAddress(address)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Connected Network</p>
                        <p className="font-medium">{walletInfo?.network.name || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet Balance</p>
                        <p className="font-medium">{walletInfo?.balance || "0"} MATIC</p>
                      </div>
                      {profile?.created_at && (
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
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Ticket Summary</h3>
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
                    <TabsTrigger value="active">Active Tickets ({activeTickets.length})</TabsTrigger>
                    <TabsTrigger value="past">Past Events ({pastTickets.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    {activeTickets.length > 0 ? (
                      <div className="space-y-4">
                        {activeTickets.map((ticket) => (
                          <div key={ticket.token_id} className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-4">
                              <div className="relative h-32 md:h-full">
                                <Image
                                  src={ticket.event_data?.event_image_url || "/placeholder.svg?height=128&width=256"}
                                  alt={ticket.event_data?.name || ticket.event_name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="p-4 md:col-span-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {ticket.event_data?.name || ticket.event_name}
                                  </h3>
                                  <div className="flex gap-2 mt-1 md:mt-0">
                                    <Badge>#{ticket.token_id}</Badge>
                                    {ticket.for_sale && <Badge variant="secondary">For Sale</Badge>}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>
                                      {ticket.event_data?.date
                                        ? new Date(ticket.event_data.date).toLocaleDateString()
                                        : "Date TBD"}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{ticket.event_data?.time || "Time TBD"}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span className="truncate">{ticket.event_data?.location || "Location TBD"}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Purchase Date: {new Date(ticket.purchase_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm font-medium">
                                      {ticket.price} ETH
                                      {ticket.for_sale && ticket.resale_price && (
                                        <span className="text-green-600 ml-2">(Listed: {ticket.resale_price} ETH)</span>
                                      )}
                                    </p>
                                  </div>
                                  <Button className="mt-2 md:mt-0" asChild>
                                    <Link href={`/tickets/${ticket.token_id}`}>View Ticket</Link>
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
                          <Link href="/marketplace">Browse Events</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past">
                    {pastTickets.length > 0 ? (
                      <div className="space-y-4">
                        {pastTickets.map((ticket) => (
                          <div key={ticket.token_id} className="border rounded-lg overflow-hidden opacity-80">
                            <div className="grid grid-cols-1 md:grid-cols-4">
                              <div className="relative h-32 md:h-full">
                                <Image
                                  src={ticket.event_data?.event_image_url || "/placeholder.svg?height=128&width=256"}
                                  alt={ticket.event_data?.name || ticket.event_name}
                                  fill
                                  className="object-cover grayscale"
                                />
                              </div>
                              <div className="p-4 md:col-span-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {ticket.event_data?.name || ticket.event_name}
                                  </h3>
                                  <Badge variant="outline" className="mt-1 md:mt-0 w-fit">
                                    #{ticket.token_id}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>
                                      {ticket.event_data?.date
                                        ? new Date(ticket.event_data.date).toLocaleDateString()
                                        : "Date TBD"}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span className="truncate">{ticket.event_data?.location || "Location TBD"}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Badge variant="secondary" className="text-xs">
                                      Past Event
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Purchase Date: {new Date(ticket.purchase_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm font-medium">{ticket.price} ETH</p>
                                  </div>
                                  <Button variant="outline" className="mt-2 md:mt-0" asChild>
                                    <Link href={`/tickets/${ticket.token_id}`}>View Details</Link>
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
                <CardDescription>Your blockchain wallet details and connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Connected Wallet</h3>
                      <p className="text-sm text-muted-foreground">{walletInfo?.network.name || "Unknown Network"}</p>
                    </div>
                    <Badge variant="outline" className="mt-2 md:mt-0 w-fit">
                      Connected
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                      <div className="flex items-center justify-between p-3 bg-background rounded border">
                        <div className="font-mono text-sm break-all">{walletInfo?.address}</div>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Connected Network</p>
                        <p className="font-medium">{walletInfo?.network.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Chain ID: {walletInfo?.network.chainId || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                        <p className="font-medium">{walletInfo?.balance || "0"} MATIC</p>
                      </div>
                    </div>
                  </div>
                </div>

                {walletInfo?.network.chainId && !["0x89", "0x13882"].includes(walletInfo.network.chainId) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Unsupported Network</h4>
                        <p className="text-sm text-yellow-700">
                          Please switch to Polygon Mainnet (Chain ID: 137) or Polygon Amoy Testnet (Chain ID: 80002)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">NFT Tickets</h3>
                  {tickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tickets.slice(0, 4).map((ticket) => (
                        <div key={ticket.token_id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium truncate">{ticket.event_data?.name || ticket.event_name}</h4>
                            <Badge variant="secondary" className="text-xs ml-2">
                              NFT
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Token ID: #{ticket.token_id}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{ticket.category}</span>
                            <Button variant="outline" size="sm" className="h-8" asChild>
                              <Link
                                href={`https://polygonscan.com/token/${ticket.token_id}`}
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
                  ) : (
                    <div className="text-center py-6 bg-muted/50 rounded-lg">
                      <Ticket className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No NFT tickets found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
