"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, ShieldCheck, User2, Wallet, Calendar, Clock, MapPin, TicketIcon, ImageIcon, Share2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/components/wallet-provider"
import { supabase } from "@/lib/supabaseClient"
import { getTicketDetailsOptimized, invalidateTicketCaches } from "@/lib/marketplaceQueries"
import {
  fetchTicketById,
  buyResaleTicket,
  listTicketForSale,
  delistTicketFromSale,
  ethToInr,
} from "@/lib/contract"

interface TicketDetails {
  id: number
  ticket_id: number
  event_id: number
  owner_address: string
  purchase_date: string
  category: string
  seat_info?: string
  price: number
  token_id: number
  for_sale: boolean
  resale_price?: number
  event_name: string
  event_description: string
  event_location: string
  event_date: string
  event_time: string
  event_image_url: string
  organizer_name: string
  is_valid: boolean
}

const TicketDetails = () => {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { address, isConnected } = useWallet()
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isResaleDialogOpen, setIsResaleDialogOpen] = useState(false)
  const [resalePriceEth, setResalePriceEth] = useState("")
  const [resalePriceError, setResalePriceError] = useState("")
  const [isListing, setIsListing] = useState(false)
  const isMounted = useRef(true)
  const channelRef = useRef<any>(null)

  // Helper function to check if event is active (not passed)
  const isEventActive = useCallback((eventDate: string, eventTime: string): boolean => {
    try {
      const eventDateTime = new Date(`${eventDate}T${eventTime}`)
      const now = new Date()
      return eventDateTime > now
    } catch (error) {
      console.error("Error parsing event date/time:", error)
      return false
    }
  }, [])

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async () => {
    try {
      if (!isMounted.current) return
      setLoading(true)
      setError(null)

      const ticketData = await getTicketDetailsOptimized(Number(id))
      if (!isMounted.current) return

      if (!ticketData) {
        setError("Ticket not found")
        toast({
          title: "Ticket not found",
          description: "The ticket you're looking for doesn't exist or you don't have access to it.",
          variant: "destructive",
        })
        return
      }

      // Transform the data to match our TicketDetails interface
      const ticketDetails: TicketDetails = {
        id: ticketData.ticket_id,
        ticket_id: ticketData.ticket_id,
        event_id: ticketData.event_id,
        owner_address: ticketData.owner_address,
        purchase_date: ticketData.purchase_date,
        category: ticketData.category,
        seat_info: ticketData.seat_info,
        price: ticketData.price,
        token_id: ticketData.token_id,
        for_sale: ticketData.for_sale || false,
        resale_price: ticketData.resale_price,
        event_name: ticketData.event_data?.name || "Unknown Event",
        event_description: ticketData.event_data?.description || "No description available",
        event_location: ticketData.event_data?.location || "Unknown Location",
        event_date: ticketData.event_data?.date || new Date().toISOString().split("T")[0],
        event_time: ticketData.event_data?.time || "00:00:00",
        event_image_url: ticketData.event_data?.event_image_url || "/placeholder.svg?height=400&width=600",
        organizer_name: ticketData.event_data?.organizer_id || "Unknown Organizer",
        is_valid: true,
      }

      setTicket(ticketDetails)
      if (ticketDetails.price && !resalePriceEth) {
        setResalePriceEth((ticketDetails.price / ethToInr(1)).toFixed(6))
      }
    } catch (err) {
      console.error("Error fetching ticket:", err)
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Failed to load ticket details")
        toast({
          title: "Error",
          description: "Failed to load ticket details. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [id, toast, resalePriceEth])

  // Initial data loading and real-time updates
  useEffect(() => {
    isMounted.current = true
    fetchTicketDetails()

    // Set up real-time listener for this ticket
    try {
      const channel = supabase
        .channel(`ticket_${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tickets",
            filter: `token_id=eq.${id}`,
          },
          (payload) => {
            console.log("Real-time ticket update:", payload)
            if (isMounted.current) {
              invalidateTicketCaches(null, Number(id))
              fetchTicketDetails()
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
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          console.error("Error removing channel:", error)
        }
      }
    }
  }, [id, fetchTicketDetails])

  const formatEthPrice = (price: number): string => {
    return `${price.toFixed(6)} ETH`
  }

  const formatPriceDisplay = (priceInEth: number) => {
    const inrValue = ethToInr(priceInEth)
    return {
      eth: formatEthPrice(priceInEth),
      inr: `₹${inrValue.toLocaleString("en-IN")}`,
    }
  }

  const handleBuyTicket = async () => {
    if (!ticket || !address) {
      toast({
        title: "Error",
        description: "Missing ticket information or wallet not connected",
        variant: "destructive",
      })
      return
    }

    setIsBuying(true)
    try {
      const priceInEth = ticket.price.toString()
      await buyResaleTicket(ticket.token_id, priceInEth, address, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })
      await fetchTicketDetails()
    } catch (error: any) {
      console.error("Error buying ticket:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to buy ticket",
        variant: "destructive",
      })
    } finally {
      setIsBuying(false)
    }
  }

  const handleCancelListing = async () => {
    if (!ticket || !address) {
      toast({
        title: "Error",
        description: "Missing ticket information or wallet not connected",
        variant: "destructive",
      })
      return
    }

    setIsCancelling(true)
    try {
      await delistTicketFromSale(ticket.token_id, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })
      await fetchTicketDetails()
    } catch (error: any) {
      console.error("Error cancelling listing:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel ticket listing",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const validateEthPrice = (value: string): boolean => {
    if (!value || value.trim() === "") {
      setResalePriceError("Please enter a price")
      return false
    }

    const ethRegex = /^\d*\.?\d{0,18}$/
    if (!ethRegex.test(value)) {
      setResalePriceError("Invalid ETH format. Use up to 18 decimal places")
      return false
    }

    const numValue = Number.parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      setResalePriceError("Price must be greater than 0")
      return false
    }

    if (numValue > 1000) {
      setResalePriceError("Price cannot exceed 1000 ETH")
      return false
    }

    if (numValue < 0.000001) {
      setResalePriceError("Price must be at least 0.000001 ETH")
      return false
    }

    setResalePriceError("")
    return true
  }

  const handleListForResale = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!validateEthPrice(resalePriceEth) || !ticket || !address) {
      toast({
        title: "Error",
        description: "Missing ticket or wallet information",
        variant: "destructive",
      })
      return
    }

    setIsListing(true)
    try {
      await listTicketForSale(ticket.token_id, resalePriceEth, address, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })

      setIsResaleDialogOpen(false)
      setResalePriceEth("")
      setResalePriceError("")
      await fetchTicketDetails()
    } catch (error: any) {
      console.error("Error listing ticket:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to list ticket for resale",
        variant: "destructive",
      })
    } finally {
      setIsListing(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!isListing && !open) {
      setIsResaleDialogOpen(false)
      setResalePriceEth("")
      setResalePriceError("")
    } else if (open) {
      setIsResaleDialogOpen(true)
    }
  }

  const handleOpenResaleDialog = () => {
    if (!ticket || !isEventActive(ticket.event_date, ticket.event_time)) {
      toast({
        title: "Event has ended",
        description: "You can only list tickets for resale before the event starts.",
        variant: "destructive",
      })
      return
    }
    setIsResaleDialogOpen(true)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setResalePriceEth(value)
    if (value && value.trim() !== "") {
      validateEthPrice(value)
    } else {
      setResalePriceError("")
    }
  }

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ticket for ${ticket?.event_name}`,
          text: `Check out my ticket for ${ticket?.event_name} on ${new Date(ticket?.event_date || "").toLocaleDateString()}`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Ticket link copied to clipboard",
        })
      }
    } catch (err) {
      console.error("Error sharing ticket:", err)
    }
  }, [ticket, toast])

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Ticket</CardTitle>
            <CardDescription>{error || "Ticket not found"}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const formattedDate = new Date(ticket.event_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const qrCodeData = JSON.stringify({
    ticketId: ticket.token_id,
    eventId: ticket.event_id,
    eventName: ticket.event_name,
    date: ticket.event_date,
    time: ticket.event_time,
    category: ticket.category,
    seatInfo: ticket.seat_info,
    ownerAddress: ticket.owner_address,
  })

  const isOwner = address && ticket.owner_address.toLowerCase() === address.toLowerCase()
  const priceDisplay = formatPriceDisplay(ticket.price)
  const eventActive = isEventActive(ticket.event_date, ticket.event_time)

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative h-64 w-full">
              {ticket.event_image_url ? (
                <Image
                  src={ticket.event_image_url || "/placeholder.svg"}
                  alt={ticket.event_name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">No image available</span>
                </div>
              )}
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">{ticket.event_name}</CardTitle>
                  <CardDescription className="text-lg mt-1">{ticket.event_description}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={ticket.for_sale ? "destructive" : "outline"}>
                    {ticket.for_sale ? "For Sale" : "Valid"}
                  </Badge>
                  {!eventActive && (
                    <Badge variant="secondary">Event Ended</Badge>
                  )}
                  {ticket.for_sale && ticket.resale_price && (
                    <Badge variant="secondary">
                      Resale Price: {formatEthPrice(ticket.resale_price)}
                    </Badge>
                  )}
                  {!isOwner && <Badge variant="outline">Not Owner</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  <span>{ticket.event_time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <span>{ticket.event_location}</span>
                </div>
                <div className="flex items-center">
                  <User2 className="h-5 w-5 mr-2 text-primary" />
                  <span>Organized by {ticket.organizer_name}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-2">Ticket Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Type</p>
                    <p className="font-medium">{ticket.category}</p>
                  </div>
                  {ticket.seat_info && (
                    <div>
                      <p className="text-sm text-muted-foreground">Seat Information</p>
                      <p className="font-medium">{ticket.seat_info}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">{priceDisplay.eth} ({priceDisplay.inr})</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{new Date(ticket.purchase_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {!address ? (
                  <div className="text-sm text-muted-foreground">
                    Please connect your wallet to interact with this ticket.
                  </div>
                ) : isOwner ? (
                  ticket.for_sale ? (
                    <Button
                      variant="destructive"
                      onClick={handleCancelListing}
                      disabled={isCancelling}
                      className="flex-1"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Listing"}
                    </Button>
                  ) : (
                    // Only show "List for Resale" button if event is active
                    eventActive && (
                      <Dialog open={isResaleDialogOpen} onOpenChange={handleDialogClose}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="flex-1" 
                            disabled={isListing}
                            onClick={handleOpenResaleDialog}
                          >
                            List for Resale
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>List Ticket for Resale</DialogTitle>
                            <DialogDescription>
                              Set your resale price in ETH. The price will be used directly on the blockchain marketplace.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleListForResale} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="resale-price">Resale Price (ETH)</Label>
                              <Input
                                id="resale-price"
                                type="text"
                                placeholder="0.002"
                                value={resalePriceEth}
                                onChange={handlePriceChange}
                                className={resalePriceError ? "border-red-500" : ""}
                                disabled={isListing}
                              />
                              {resalePriceError && <div className="text-sm text-red-500">{resalePriceError}</div>}
                              {resalePriceEth && !resalePriceError && (
                                <div className="text-sm text-muted-foreground">
                                  ≈ ₹{ethToInr(Number.parseFloat(resalePriceEth)).toLocaleString("en-IN")}
                                </div>
                              )}
                            </div>
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Important</AlertTitle>
                              <AlertDescription>
                                A 2.5% platform fee will be deducted from the final sale price.
                              </AlertDescription>
                            </Alert>
                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => handleDialogClose(false)} 
                                disabled={isListing}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isListing || !!resalePriceError || !resalePriceEth.trim()}>
                                {isListing ? "Listing..." : "List for Resale"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )
                  )
                ) : (
                  <Button
                    className="flex-1"
                    onClick={handleBuyTicket}
                    disabled={isBuying || !ticket.for_sale}
                  >
                    {isBuying ? "Buying..." : ticket.for_sale ? `Buy Ticket (${priceDisplay.eth})` : "Not for Sale"}
                  </Button>
                )}

                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Show message if event has ended and user is owner */}
              {!eventActive && isOwner && !ticket.for_sale && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Event has ended</AlertTitle>
                  <AlertDescription>
                    This event has already taken place. Tickets can no longer be listed for resale.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 flex flex-col items-start">
              <p className="text-sm text-muted-foreground mb-1">Owner Address</p>
              <p className="font-mono text-xs break-all">{ticket.owner_address}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">Token ID</p>
              <p className="font-mono text-xs">{ticket.token_id}</p>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TicketIcon className="h-5 w-5 mr-2" />
                Your Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="bg-white p-5 rounded-lg shadow-inner w-full max-w-xs">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{ticket.event_name}</h3>
                    <p className="text-sm text-gray-700">{formattedDate} | {ticket.event_time}</p>
                  </div>

                  <div className="w-48 h-48 bg-white flex items-center justify-center mb-4 p-2 border border-gray-300 rounded">
                    <QRCodeSVG
                      value={qrCodeData}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="text-center w-full">
                    <p className="text-base font-semibold text-gray-800">{ticket.category}</p>
                    {ticket.seat_info && (
                      <p className="text-base font-medium text-gray-700">Seat: {ticket.seat_info}</p>
                    )}
                    <p className="text-xs mt-2 font-mono text-gray-600">#{ticket.token_id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-center text-muted-foreground">
                {ticket.for_sale
                  ? "This ticket is currently listed for resale"
                  : eventActive 
                    ? "Present this ticket at the venue entrance"
                    : "This event has ended"}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TicketDetails
