"use client"
import { useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, ArrowLeft } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getEventDetails, buyResaleTicket, ethToInr } from "@/lib/contract"
import { getIPFSGatewayURL } from "@/lib/ipfs"
import { useRouter } from "next/navigation"
import { getTicketsListedForEvent, completeSecondarySale } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

export default function MarketplaceEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const eventId = Number.parseInt(params.id)
  const { isConnected, connectWallet, address } = useWallet()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceSort, setPriceSort] = useState("asc")
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fanListedTickets, setFanListedTickets] = useState<any[]>([])
  const [purchasingTicketId, setPurchasingTicketId] = useState<number | null>(null)
  const [eventStatus, setEventStatus] = useState<string>("active")
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  // Load event details
  useEffect(() => {
    let isMounted = true

    const fetchEventDetails = async () => {
      try {
        console.log("Fetching event by ID:", eventId)

        // Get event details from Supabase
        const eventData = await getEventDetails(eventId)

        if (!eventData) {
          throw new Error("Event not found")
        }

        // Fetch total tickets sold count
        const { count: ticketsSold, error: ticketsError } = await supabase
          .from("tickets")
          .select("*", { count: "exact" })
          .eq("event_id", eventId)

        if (ticketsError) {
          console.error("Error fetching tickets sold count:", ticketsError.message)
        }

        if (isMounted) {
          // Store event details with ticketsSold count
          setEvent({ ...eventData, ticketsSold: ticketsSold || 0 })

          // Check event status
          if (eventData.status) {
            setEventStatus(eventData.status)
          } else {
            // Calculate status based on date if not available
            const eventDate = new Date(eventData.date)
            const now = new Date()
            const status = eventDate >= now ? "active" : "expired"
            setEventStatus(status)

            // Update status in database
            try {
              await supabase.from("event_data").update({ status }).eq("id", eventId)
            } catch (err) {
              console.error("Failed to update event status:", err)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching event details:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load event details. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEventDetails()

    return () => {
      isMounted = false
    }
  }, [eventId, toast])

  // Fetch fan-listed tickets
  const fetchFanListedTickets = useCallback(async () => {
    try {
      console.log(`Fetching tickets for sale for event: ${eventId}`)

      // Get tickets from database
      const dbTickets = await getTicketsListedForEvent(eventId)

      if (!dbTickets || dbTickets.length === 0) {
        setFanListedTickets([])
        return
      }

      // Transform the data
      const transformedTickets = dbTickets.map((dbTicket) => {
        return {
          id: dbTicket.token_id,
          saleId: dbTicket.sale_id,
          category: dbTicket.tickets?.category || "General",
          seatInfo: dbTicket.tickets?.seat_info || "No seat info",
          price: dbTicket.resale_price,
          originalPrice: dbTicket.original_price,
          seller: dbTicket.seller_address,
          status: dbTicket.status,
        }
      })

      setFanListedTickets(transformedTickets)
    } catch (error) {
      console.error("Error fetching fan-listed tickets:", error)
      setFanListedTickets([])
    }
  }, [eventId])

  // Set up real-time updates
  const setupRealtimeUpdates = useCallback(() => {
    if (!supabase) return

    // Unsubscribe from any existing subscription
    if (realtimeChannel) {
      realtimeChannel.unsubscribe()
    }

    // Subscribe to changes in the secondary_sales table
    const channel = supabase
      .channel("secondary-sales-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "secondary_sales",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("Real-time update received:", payload)
          // Refresh the tickets list
          fetchFanListedTickets()
        },
      )
      .subscribe()

    setRealtimeChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [eventId, fetchFanListedTickets, realtimeChannel])

  // Set up real-time updates
  useEffect(() => {
    const cleanup = setupRealtimeUpdates()
    return cleanup
  }, [setupRealtimeUpdates])

  // Load fan-listed tickets
  useEffect(() => {
    if (event) {
      fetchFanListedTickets()
    }
  }, [event, fetchFanListedTickets])

  // Filter and sort the tickets
  const filteredAndSortedTickets = useMemo(() => {
    // First filter by category
    let filtered = fanListedTickets
    if (categoryFilter !== "all") {
      filtered = fanListedTickets.filter((ticket) => ticket.category === categoryFilter)
    }

    // Then sort by price
    return filtered.sort((a, b) => {
      const priceA = Number.parseFloat(a.price)
      const priceB = Number.parseFloat(b.price)

      return priceSort === "asc" ? priceA - priceB : priceB - priceA
    })
  }, [fanListedTickets, categoryFilter, priceSort])

  // Handle buying a ticket
  const handleBuyTicket = async (
    ticketId: number,
    saleId: string,
    price: string,
    seatInfo: string,
    category: string,
  ) => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    setPurchasingTicketId(ticketId)
    setIsLoading(true)

    try {
      // Execute the blockchain transaction
      const result = await buyResaleTicket(ticketId, price)

      // Update the secondary sale status
      await completeSecondarySale(saleId, ticketId, address)

      // Store the purchase in Supabase
      const { data, error } = await supabase.from("tickets").insert({
        event_id: eventId,
        event_name: event.name,
        owner_address: address,
        price: Number(price),
        category: category,
        token_uri: "", // You might want to get this from the blockchain
        image_url: event.event_image_url || "/placeholder.svg",
        token_id: ticketId,
        purchase_date: new Date().toISOString(),
        seat_info: seatInfo,
        qr_code: "", // You might want to generate this
        activity: "buyResaleTicket", // Set activity to buyResaleTicket
      })

      if (error) {
        console.error("Error storing ticket purchase in Supabase:", error)
        // Continue anyway since the blockchain transaction was successful
      }

      toast({
        title: "Purchase successful!",
        description: `You've purchased ticket #${ticketId} successfully.`,
      })

      // Refresh the tickets list
      fetchFanListedTickets()

      // Navigate to tickets page
      router.push("/tickets")
    } catch (error) {
      console.error("Error buying ticket:", error)
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setPurchasingTicketId(null)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="space-y-8 animate-pulse">
          <div className="rounded-lg overflow-hidden bg-muted h-[400px]"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-10">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Event not found</h3>
          <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-4" asChild>
            <a href="/marketplace">Browse Marketplace</a>
          </Button>
        </div>
      </div>
    )
  }

  // Get event image URL
  const imageUrl =
    event.event_image_url ||
    (event?.ipfsuri?.startsWith("ipfs://")
      ? getIPFSGatewayURL(event.ipfsuri)
      : "/placeholder.svg?height=600&width=1200")

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.push(`/events/${eventId}`)} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event Details
          </Button>
        </div>

        <div className="rounded-lg overflow-hidden">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={event.name}
            className="w-[800px] h-[400px] object-cover mx-auto rounded-lg shadow-lg"
            onError={(e) => {
              // Fallback if image fails to load
              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=1200"
            }}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <div className="flex items-center mt-2 space-x-2">
            <Badge>{event.category || "Event"}</Badge>
            {eventStatus !== "active" && (
              <Badge variant="destructive">{eventStatus === "canceled" ? "Canceled" : "Expired"}</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Organized by {event.organizer?.slice(0, 6)}...{event.organizer?.slice(-4)}
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-[200px]">
              <label className="text-sm font-medium mb-2 block">Filter by Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Corporate BOX">Corporate Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[200px]">
              <label className="text-sm font-medium mb-2 block">Sort by Price</label>
              <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Price: Low to High</SelectItem>
                  <SelectItem value="desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fan-Listed Tickets</CardTitle>
              <CardDescription>These tickets are being resold by fans who can no longer attend</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ) : filteredAndSortedTickets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seat No.</TableHead>
                      <TableHead>Ticket Category</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Listing Price
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.seatInfo}</TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          {ticket.price} ETH
                          <div className="text-xs text-muted-foreground">
                            ₹{ethToInr(ticket.price).toLocaleString("en-IN")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.seller.slice(0, 6)}...{ticket.seller.slice(-4)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleBuyTicket(ticket.id, ticket.saleId, ticket.price, ticket.seatInfo, ticket.category)
                            }
                            disabled={isLoading || purchasingTicketId === ticket.id || eventStatus !== "active"}
                          >
                            {purchasingTicketId === ticket.id ? "Processing..." : "Buy"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No fan-listed tickets available for this event.</p>
                  <p className="text-sm mt-2">Check back later or purchase official tickets.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
