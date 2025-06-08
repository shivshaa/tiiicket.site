"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { getEventById } from "@/lib/supabase"
import { getTicketsListedForEventOptimized } from "@/lib/marketplaceQueries"
import { ethToInr } from "@/lib/contract"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LazyImage } from "@/components/ui/lazy-image"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, MapPin, Tag, Ticket, ArrowLeft, Info, RefreshCw, Clock, Users, Star, Shield, TrendingUp, Eye } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function EventMarketplacePage({ params }) {
  const [event, setEvent] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [buyingTicket, setBuyingTicket] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { address } = useWallet()
  const { toast } = useToast()
  const eventId = params.id
  const isMounted = useRef(true)
  const channelRef = useRef(null)

  // Fetch event details
  const fetchEventDetails = useCallback(async () => {
    try {
      if (!isMounted.current) return

      setLoading(true)
      setError(null)

      const eventData = await getEventById(eventId)

      if (!isMounted.current) return

      if (!eventData) {
        setError("Event not found")
        toast({
          title: "Event not found",
          description: "The event you're looking for doesn't exist or has been removed",
          variant: "destructive",
        })
        return
      }

      setEvent(eventData)
    } catch (error) {
      console.error("Error fetching event data:", error)
      if (isMounted.current) {
        setError("Failed to load event")
        toast({
          title: "Error loading data",
          description: "There was a problem loading the event information",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [eventId, toast])

  // Fetch tickets for this event
  const fetchTickets = useCallback(async () => {
    try {
      if (!isMounted.current) return

      setTicketsLoading(true)

      const listedTickets = await getTicketsListedForEventOptimized(eventId)

      if (!isMounted.current) return

      setTickets(listedTickets)
    } catch (error) {
      console.error("Error fetching tickets:", error)
      if (isMounted.current) {
        toast({
          title: "Error loading tickets",
          description: "Failed to load available tickets. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setTicketsLoading(false)
      }
    }
  }, [eventId, toast])

  // Initial data loading
  useEffect(() => {
    isMounted.current = true

    fetchEventDetails()
    fetchTickets()

    // Set up real-time listener for this event's tickets
    try {
      const channel = supabase
        .channel(`secondary_sales_${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "secondary_sales",
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            console.log("Real-time update:", payload)
            if (isMounted.current) {
              fetchTickets()
            }
          },
        )
        .subscribe()

      channelRef.current = channel
    } catch (error) {
      console.error("Error setting up real-time listener:", error)
    }

    return () => {
      isMounted.current = false

      // Clean up the subscription
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          console.error("Error removing channel:", error)
        }
      }
    }
  }, [eventId, fetchEventDetails, fetchTickets])

  const handleBuyTicket = useCallback(
    async (ticket) => {
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to purchase tickets",
          variant: "destructive",
        })
        return
      }

      try {
        setBuyingTicket(ticket.token_id)

        // Navigate to the purchase page with the ticket details
        router.push(`/market/purchase/${ticket.token_id}`)
      } catch (error) {
        console.error("Error initiating purchase:", error)
        toast({
          title: "Purchase failed",
          description: error.message || "There was an error initiating the purchase",
          variant: "destructive",
        })
        setBuyingTicket(null)
      }
    },
    [address, router, toast],
  )

  const handleRefreshTickets = useCallback(() => {
    fetchTickets()
  }, [fetchTickets])

  const truncateAddress = useCallback((address) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }, [])

  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch (e) {
      return dateString || "TBA"
    }
  }, [])

  const getPriceStatus = useCallback((resalePrice, originalPrice) => {
    if (!originalPrice) return { status: "unknown", color: "text-slate-500", label: "N/A" }
    const increase = ((resalePrice - originalPrice) / originalPrice) * 100
    if (increase > 20) return { status: "high", color: "text-red-500", label: `+${Math.round(increase)}%` }
    if (increase > 0) return { status: "medium", color: "text-yellow-500", label: `+${Math.round(increase)}%` }
    return { status: "fair", color: "text-green-500", label: "Fair Price" }
  }, [])

  const getListingAge = useCallback((listedAt) => {
    if (!listedAt) return "Recently"
    const now = new Date()
    const listed = new Date(listedAt)
    const diffHours = Math.floor((now - listed) / (1000 * 60 * 60))
    
    if (diffHours < 1) return "Just listed"
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-20" />
              <div>
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/50">
                <Skeleton className="aspect-video w-full" />
                <div className="p-6">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <div className="space-y-3 mb-6">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                  <Skeleton className="h-20 w-full mb-6" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50">
                <div className="p-6">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                </div>
                <div className="p-6">
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="mb-6 text-slate-600">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/market")}>Return to Marketplace</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Ticket Marketplace
                </h1>
                <p className="text-slate-500 text-sm">Secure secondary ticket sales</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <Shield className="h-4 w-4" />
                Verified Listings
              </div>
              <button 
                onClick={handleRefreshTickets}
                disabled={ticketsLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-slate-600 ${ticketsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Event Details - Left Side */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/50">
              {/* Event Image */}
              <div className="relative aspect-video overflow-hidden">
                <LazyImage
                  src={event.event_image_url || "/placeholder.svg?height=400&width=800"}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <div className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                    {event.status === "active" ? "Live" : event.status}
                  </div>
                  <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-medium rounded-full">
                    {event.category || "Event"}
                  </div>
                </div>
                {event.max_tickets && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                      <Eye className="h-4 w-4" />
                      {event.max_tickets.toLocaleString()} total capacity
                    </div>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{event.name}</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{formatDate(event.date)}</p>
                      {event.time && <p className="text-sm">{event.time}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{event.location || "Location TBA"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Tag className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Original Price</p>
                      <p className="font-semibold text-slate-900">
                        {event.ticket_price} ETH 
                        <span className="text-slate-500 font-normal ml-1">
                          (₹{ethToInr(event.ticket_price).toLocaleString()})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-slate-900 mb-2">About this event</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {event.description || "No description available for this event."}
                  </p>
                </div>

                {/* Stats */}
                {event.max_tickets && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">Capacity</span>
                      </div>
                      <p className="text-xl font-bold text-blue-900">{event.max_tickets.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Ticket className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Available</span>
                      </div>
                      <p className="text-xl font-bold text-green-900">{tickets.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tickets Table - Right Side */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-blue-600" />
                      Available Tickets
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} available for resale
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
                      <Clock className="h-4 w-4" />
                      Live updates
                    </div>
                  </div>
                </div>
                
                {/* Price Legend */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">Fair Price</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-slate-600">Premium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-slate-600">High Premium</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {ticketsLoading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : tickets.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Seat Details</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Price</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Seller</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Listed</th>
                        <th className="text-center py-4 px-6 text-sm font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket, index) => {
                        const priceStatus = getPriceStatus(ticket.resale_price, event.ticket_price)
                        return (
                          <tr 
                            key={ticket.token_id} 
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    {ticket.tickets?.seat_info || `Ticket #${ticket.token_id}`}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                      <Shield className="h-3 w-3" />
                                      Verified
                                    </div>
                                    <span className="text-xs text-slate-500">ID: {ticket.token_id}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{ticket.resale_price} ETH</span>
                                  <span className={`text-xs font-medium ${priceStatus.color}`}>
                                    {priceStatus.label}
                                  </span>
                                </div>
                                <span className="text-sm text-slate-500">
                                  ₹{ethToInr(ticket.resale_price).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {ticket.seller_address ? ticket.seller_address.slice(2, 4).toUpperCase() : "??"}
                                </div>
                                <div>
                                  <p className="font-mono text-sm text-slate-700">
                                    {truncateAddress(ticket.seller_address)}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs text-slate-500">Verified</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-slate-600">
                                {getListingAge(ticket.listed_at)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleBuyTicket(ticket)}
                                disabled={buyingTicket === ticket.token_id}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              >
                                {buyingTicket === ticket.token_id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing
                                  </div>
                                ) : (
                                  "Purchase"
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets available</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      There are currently no tickets listed for resale for this event. Check back later for new listings.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Trust & Security Notice */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Secure Marketplace</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    All tickets are verified through blockchain technology. Sellers are rated and reviewed. 
                    Your purchase is protected with our buyer guarantee program.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
