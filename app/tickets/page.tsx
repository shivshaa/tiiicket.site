"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/components/wallet-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Clock, MapPin, DollarSign, RefreshCw, Ticket, Tag } from "lucide-react"
import Link from "next/link"
import { getUserTickets, ethToInr, delistTicketFromSale } from "@/lib/contract"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

export default function TicketsPage() {
  const router = useRouter()
  const { isConnected, connectWallet, address } = useWallet()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingTicket, setCancellingTicket] = useState<number | null>(null)

  useEffect(() => {
    if (!isConnected) {
      return
    }

    const fetchTickets = async () => {
      setLoading(true)
      try {
        if (address) {
          // Fetch tickets from Supabase with event data
          const userTickets = await getUserTickets(address)
          console.log("User tickets:", userTickets)
          setTickets(Array.isArray(userTickets) ? userTickets : [])
        }
      } catch (error) {
        console.error("Error fetching tickets:", error)
        toast({
          title: "Error",
          description: "Failed to load your tickets. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [isConnected, address, toast])

  const handleCancelListing = async (tokenId: number) => {
    try {
      setCancellingTicket(tokenId)

      // Call the contract function to delist the ticket
      await delistTicketFromSale(tokenId)

      // Update the ticket status in the database
      await supabase
        .from("tickets")
        .update({
          for_sale: false,
          resale_price: null,
          activity: "delistTicketFromSale",
        })
        .eq("token_id", tokenId)

      // Update the local state
      setTickets(
        tickets.map((ticket) =>
          ticket.token_id === tokenId ? { ...ticket, for_sale: false, resale_price: null } : ticket,
        ),
      )

      toast({
        title: "Success!",
        description: "Your ticket has been removed from the marketplace",
      })
    } catch (error) {
      console.error("Error cancelling ticket listing:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel ticket listing",
        variant: "destructive",
      })
    } finally {
      setCancellingTicket(null)
    }
  }

  if (!isConnected) {
    return (
      <div className="container py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>Connect your wallet to view your tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Tickets</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <h3 className="text-xl font-semibold mb-2">No Tickets Found</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                You don't have any tickets yet. Browse events and purchase tickets to see them here.
              </p>
              <Button asChild>
                <Link href="/marketplace">Browse Events</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Tickets ({tickets.length})</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <Card key={ticket.token_id} className="overflow-hidden h-full">
              <div className="aspect-video w-full overflow-hidden">
                <Image
                  src={ticket.event_image_url || "/placeholder.svg?height=200&width=400"}
                  alt={ticket.event_name}
                  width={400}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{ticket.event_name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge>#{ticket.token_id}</Badge>
                    {ticket.for_sale && <Badge variant="secondary">For Sale</Badge>}
                  </div>
                </div>
                <CardDescription>
                  {ticket.category} • {ticket.seat_info || "General Admission"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {ticket.event_date
                      ? new Date(ticket.event_date).toLocaleDateString()
                      : new Date(ticket.purchase_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {ticket.event_time ||
                      new Date(ticket.purchase_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{ticket.event_location || "Unknown Venue"}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>₹{ethToInr(ticket.price).toLocaleString("en-IN")}</span>
                </div>
                {ticket.for_sale && (
                  <div className="flex items-center">
                    <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      Resale: {ticket.resale_price} ETH (₹{ethToInr(ticket.resale_price).toLocaleString("en-IN")})
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{ticket.seat_info || "General Admission"}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href={`/tickets/${ticket.token_id}`}>View Details</Link>
                </Button>

                {ticket.for_sale && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCancelListing(ticket.token_id)}
                    disabled={cancellingTicket === ticket.token_id}
                  >
                    {cancellingTicket === ticket.token_id ? "Cancelling..." : "Cancel Listing"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
