"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
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
import { Calendar, MapPin, Tag, Ticket, ArrowLeft, Info, RefreshCw } from "lucide-react"
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
      return format(new Date(dateString), "MMMM dd, yyyy")
    } catch (e) {
      return dateString || "TBA"
    }
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="h-[300px] w-full rounded-lg mb-4" />
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/market")}>Return to Marketplace</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Marketplace</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="aspect-video relative">
              <LazyImage
                src={event.event_image_url || "/placeholder.svg?height=400&width=800"}
                alt={event.name}
                className="object-cover w-full h-full"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Badge variant={event.status === "active" ? "success" : "secondary"}>{event.status || "Active"}</Badge>
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                  {event.category || "Event"}
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-2xl">{event.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-base">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)}
                {event.time && ` • ${event.time}`}
              </CardDescription>
              <CardDescription className="flex items-center gap-1 text-base">
                <MapPin className="h-4 w-4" />
                {event.location || "Location TBA"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <h3 className="font-semibold mb-2">About this event</h3>
              <p className="text-muted-foreground mb-6">
                {event.description || "No description available for this event."}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4" />
                <h3 className="font-semibold">Original Ticket Price:</h3>
                <span>{event.ticket_price} ETH</span>
                <span className="text-sm text-muted-foreground">
                  (₹{ethToInr(event.ticket_price).toLocaleString()})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <h3 className="font-semibold">Max Tickets:</h3>
                <span>{event.max_tickets}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Available Tickets
                </CardTitle>
                <CardDescription>
                  {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} available for resale
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshTickets}
                disabled={ticketsLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${ticketsLoading ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </CardHeader>

            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : tickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seat Info</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.token_id}>
                          <TableCell className="font-medium">
                            {ticket.tickets?.seat_info || `Ticket #${ticket.token_id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">{ticket.resale_price} ETH</span>
                              <span className="text-xs text-muted-foreground">
                                ₹{ethToInr(ticket.resale_price).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{truncateAddress(ticket.seller_address)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleBuyTicket(ticket)}
                              disabled={buyingTicket === ticket.token_id}
                              className="w-full"
                            >
                              {buyingTicket === ticket.token_id ? "Processing..." : "Buy"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="font-semibold mb-1">No tickets available</h3>
                  <p className="text-sm text-muted-foreground">
                    There are currently no tickets listed for resale for this event.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
