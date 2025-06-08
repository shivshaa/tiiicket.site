"use client"
import { supabase } from "@/lib/supabase"
import { CardFooter } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Ticket, DollarSign, ArrowRight } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getEventDetails, mintTicket, ethToInr } from "@/lib/contract"
import { createTicketMetadata, getIPFSGatewayURL } from "@/lib/ipfs"
import { useRouter } from "next/navigation"

export default function EventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const eventId = Number.parseInt(params.id)
  const { isConnected, connectWallet, address } = useWallet()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTicketCategory, setSelectedTicketCategory] = useState("General")
  const [eventStatus, setEventStatus] = useState<string>("active")

  const checkWalletExists = async (walletAddress: string) => {
    const { data, error } = await supabase
      .from("user_data")
      .select("wallet_address")
      .eq("wallet_address", walletAddress.toLowerCase()) // Convert input to lowercase
      .single()

    if (error) {
      console.error("Error checking wallet address:", error.message)
      return false // Wallet not found
    }

    return !!data // Returns true if wallet exists
  }

  // Load event details
  useEffect(() => {
    let isMounted = true

    const fetchEventDetails = async () => {
      try {
        console.log("Fetching event by ID:", eventId)

        // ✅ Get event details from Supabase
        const eventData = await getEventDetails(eventId)

        if (!eventData) {
          throw new Error("Event not found")
        }

        // ✅ Fetch total tickets sold count
        const { count: ticketsSold, error: ticketsError } = await supabase
          .from("tickets")
          .select("*", { count: "exact" })
          .eq("event_id", eventId)

        if (ticketsError) {
          console.error("Error fetching tickets sold count:", ticketsError.message)
        }

        if (isMounted) {
          // ✅ Store event details with ticketsSold count
          setEvent({ ...eventData, ticketsSold: ticketsSold || 0 })

          // ✅ Check event status
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

  const handleMintTicket = async () => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    if (!event) return

    // Check if event is active
    if (eventStatus !== "active") {
      toast({
        title: "Cannot purchase ticket",
        description: eventStatus === "canceled" ? "This event has been canceled." : "This event has expired.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // ✅ Step 1: Check if wallet address exists in the users table
      const walletExists = await checkWalletExists(address)
      if (!walletExists) {
        toast({
          title: "Wallet Not Registered",
          description: "Your wallet address is not registered in the system.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // ✅ Step 2: Generate Seat Info
      const seatSection = String.fromCharCode(65 + Math.floor(Math.random() * 26)) // A-Z
      const seatRow = Math.floor(Math.random() * 20) + 1
      const seatNumber = Math.floor(Math.random() * 30) + 1
      const seatInfo = `Section ${seatSection}, Row ${seatRow}, Seat ${seatNumber}`

      // ✅ Step 3: Generate and Upload Ticket Metadata to IPFS
      let ticketURI = ""
      let ticketImageURI = ""
      let qrCodeURI = ""
      try {
        const { metadataURI, imageURI, qrCodeBase64 } = await createTicketMetadata(
          {
            eventName: event.name,
            eventId: eventId,
            seatInfo,
            ticketCategory: selectedTicketCategory,
          },
          supabase,
        )

        ticketURI = metadataURI
        ticketImageURI = getIPFSGatewayURL(imageURI)
        qrCodeURI = qrCodeBase64 // Store QR code as Base64 in Supabase
        console.log("Ticket metadata uploaded to IPFS:", ticketURI)
      } catch (error) {
        console.error("Error uploading ticket metadata to IPFS:", error)
        toast({
          title: "IPFS upload failed",
          description: "Failed to upload ticket metadata. Using placeholder instead.",
          variant: "destructive",
        })
        ticketImageURI = "/placeholder.svg"
        ticketURI = `https://example.com/ticket/${Date.now()}`
      }

      // ✅ Step 4: Mint Ticket on Blockchain
      let tokenId = 0
      try {
        const mintResult = await mintTicket(
          eventId,
          ticketURI,
          seatInfo,
          selectedTicketCategory,
          String(event.ticketPrice),
        )
        tokenId = mintResult.tokenId // Assuming mintTicket returns the tokenId
        console.log("Ticket minted with Token ID:", tokenId)
      } catch (error) {
        console.error("Error minting ticket on blockchain:", error)
        toast({
          title: "Blockchain minting failed",
          description: "Failed to mint ticket. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // ✅ Step 5: Insert Ticket Data into Supabase
      const { data, error } = await supabase.from("tickets").insert({
        event_id: eventId,
        event_name: event.name,
        owner_address: address,
        price: Number(event.ticketPrice),
        category: selectedTicketCategory,
        token_uri: ticketURI,
        image_url: ticketImageURI,
        token_id: tokenId,
        purchase_date: new Date().toISOString(),
        seat_info: `Section ${seatSection}, Row ${seatRow}, Seat ${seatNumber}`,
        qr_code: qrCodeURI,
        activity: "mintTicket", // ✅ Add activity column
      })

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      toast({
        title: "Ticket Purchased!",
        description: `You've successfully purchased a ${selectedTicketCategory} ticket for ${event.name}.`,
      })

      // Navigate to the tickets page after successful purchase
      router.push("/tickets")
    } catch (error) {
      console.error("Error minting ticket:", error)
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewMarketplace = () => {
    router.push(`/market/event/${eventId}`)
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
            <a href="/market">Browse Marketplace</a>
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

  // Function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    if (!status) return "outline"

    switch (status.toLowerCase()) {
      case "active":
        return "success"
      case "canceled":
      case "cancelled":
        return "destructive"
      case "inactive":
        return "outline"
      case "expired":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Function to get display text for status
  const getStatusDisplayText = (status: string) => {
    if (!status) return "Active"

    switch (status.toLowerCase()) {
      case "canceled":
      case "cancelled":
        return "Cancelled"
      case "inactive":
        return "Inactive"
      case "active":
        return "Active"
      case "expired":
        return "Expired"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="container py-10">
      <div className="space-y-8">
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

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground mt-2">{event.description}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge>{event.category || "Event"}</Badge>
            <Badge variant={getStatusBadgeVariant(event.status)}>{getStatusDisplayText(event.status)}</Badge>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="venue">Venue</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                <span>
                  Starts at{" "}
                  {event.time || new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <Ticket className="mr-2 h-5 w-5 text-primary" />
                <span>
                  {event.ticketsSold || 0} / {event.maxTickets} tickets sold
                </span>
              </div>
              <div className="flex items-center font-bold mt-2">
                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                <span>
                  Price: {event.ticketPrice} ETH (₹{ethToInr(event.ticketPrice).toLocaleString("en-IN")})
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">About This Event</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Purchase Tickets</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Buy Official Tickets</CardTitle>
                  <CardDescription>Purchase tickets directly from the event organizer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ticket Category</label>
                    <Select value={selectedTicketCategory} onValueChange={setSelectedTicketCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General Admission</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Corporate BOX">Corporate Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between py-2">
                      <span>Price per ticket:</span>
                      <span>{event.ticketPrice} ETH</span>
                    </div>
                    <div className="flex justify-between py-2 text-muted-foreground">
                      <span>INR Equivalent:</span>
                      <span>₹{ethToInr(event.ticketPrice).toLocaleString("en-IN")}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between py-2 font-bold">
                      <span>Total:</span>
                      <span>
                        {event.ticketPrice} ETH (₹{ethToInr(event.ticketPrice).toLocaleString("en-IN")})
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <Button
                    className="w-full"
                    onClick={handleMintTicket}
                    disabled={isLoading || event.ticketsSold >= event.maxTickets || eventStatus !== "active"}
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Processing...
                      </>
                    ) : event.ticketsSold >= event.maxTickets ? (
                      "Sold Out"
                    ) : eventStatus !== "active" ? (
                      eventStatus === "canceled" ? (
                        "Event Canceled"
                      ) : (
                        "Event Expired"
                      )
                    ) : isConnected ? (
                      "Buy Ticket"
                    ) : (
                      "Connect Wallet to Purchase"
                    )}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleViewMarketplace}>
                    View Marketplace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="venue" className="space-y-4 pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Venue Information</h3>
              <p className="text-muted-foreground">{event.location}</p>
            </div>

            <div className="rounded-lg overflow-hidden border h-[300px] bg-muted flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Map view would be displayed here</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Getting There</h3>
              <p className="text-muted-foreground">
                Please check local transportation options to reach {event.location}.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
