"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LazyImage } from "@/components/ui/lazy-image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTicketsListedForEvent } from "@/lib/supabase"
import { ethToInr } from "@/lib/contract"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Ticket, Calendar, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

// Create a cache for tickets
const ticketCache = new Map()

// Use memo to prevent unnecessary re-renders
const MarketplaceEventCard = memo(function MarketplaceEventCard({ event }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [buyingTicket, setBuyingTicket] = useState(null)
  const router = useRouter()
  const { address } = useWallet()
  const { toast } = useToast()
  const isMounted = useRef(true)
  const channelRef = useRef(null)
  const cacheKey = `event-${event.id}`

  // Memoize the fetch tickets function to prevent unnecessary re-renders
  const fetchTickets = useCallback(async () => {
    try {
      if (!isMounted.current) return

      setLoading(true)

      // Check cache first
      if (ticketCache.has(cacheKey)) {
        setTickets(ticketCache.get(cacheKey))
        setLoading(false)
        return
      }

      const listedTickets = await getTicketsListedForEvent(event.id)

      if (!isMounted.current) return

      setTickets(listedTickets)

      // Update cache
      ticketCache.set(cacheKey, listedTickets)

      // Cache expiration (5 minutes)
      setTimeout(
        () => {
          ticketCache.delete(cacheKey)
        },
        5 * 60 * 1000,
      )
    } catch (error) {
      console.error(`Error fetching tickets for event ${event.id}:`, error)
      if (isMounted.current) {
        toast({
          title: "Error loading tickets",
          description: "Failed to load available tickets. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [event.id, cacheKey, toast])

  useEffect(() => {
    isMounted.current = true

    fetchTickets()

    // Set up real-time listener for this event's tickets
    try {
      const channel = supabase
        .channel(`secondary_sales_${event.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "secondary_sales",
            filter: `event_id=eq.${event.id}`,
          },
          (payload) => {
            console.log("Real-time update:", payload)
            // Invalidate cache on changes
            ticketCache.delete(cacheKey)
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
  }, [event.id, fetchTickets, cacheKey])

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

  const truncateAddress = useCallback((address) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }, [])

  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (e) {
      return dateString || "TBA"
    }
  }, [])

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-video relative overflow-hidden">
        <LazyImage
          src={event.event_image_url || "/placeholder.svg?height=300&width=600"}
          alt={event.name}
          className="object-cover w-full h-full transition-transform hover:scale-105"
        />
        <Badge className="absolute top-2 right-2" variant="secondary">
          {event.category || "Event"}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl line-clamp-1">{event.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatDate(event.date)}
          {event.time && ` • ${event.time}`}
        </CardDescription>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {event.location || "Location TBA"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {event.description || "No description available"}
        </p>

        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          Available Tickets
        </h3>

        {loading ? (
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
                  <TableHead>Seat</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.slice(0, 3).map((ticket) => (
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
          <p className="text-sm text-muted-foreground italic">No tickets available for resale</p>
        )}

        {tickets.length > 3 && (
          <p className="text-xs text-center mt-2 text-muted-foreground">+{tickets.length - 3} more tickets available</p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => router.push(`/market/event/${event.id}`)}>
          View All Tickets
        </Button>
      </CardFooter>
    </Card>
  )
})

export { MarketplaceEventCard }
