"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, User, TicketIcon, ImageIcon, Tag, Share2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getTicketDetailsOptimized, invalidateTicketCaches } from "@/lib/marketplaceQueries"
import { useWallet } from "@/components/wallet-provider"
import { supabase } from "@/lib/supabaseClient"

import {
  fetchTicketById,
  buyResaleTicket,
  listTicketForSale,
  delistTicketFromSale,
  transferTicketBlockchainFirst,
  ethToInr,
} from "@/lib/contract"

// ETH to INR conversion rate
const ETH_TO_INR = 200000

// Helper functions for currency conversion
const ethToInr = (ethAmount) => {
  return ethAmount * ETH_TO_INR
}

const inrToEth = (inrAmount) => {
  return inrAmount / ETH_TO_INR
}

export default function TicketDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { address } = useWallet()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resalePriceEth, setResalePriceEth] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [listingStatus, setListingStatus] = useState({ status: "idle", message: "" })
  const [cancelStatus, setCancelStatus] = useState({ status: "idle", message: "" })
  const { toast } = useToast()
  const isMounted = useRef(true)
  const channelRef = useRef(null)

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
      const ticketDetails = {
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
      }

      setTicket(ticketDetails)

      // Set initial resale price in ETH based on original price (assuming original price is in INR)
      if (ticketDetails.price && !resalePriceEth) {
        const originalPriceInEth = inrToEth(ticketDetails.price)
        setResalePriceEth(originalPriceInEth.toFixed(6))
      }
    } catch (err) {
      console.error("Error fetching ticket:", err)
      if (isMounted.current) {
        setError(err.message || "Failed to load ticket details")
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
              // Invalidate cache and refetch
              invalidateTicketCaches(null, Number(id))
              fetchTicketDetails()
            }
          },
        )
        .subscribe()

      // Also listen for secondary sales changes
      const salesChannel = supabase
        .channel(`secondary_sales_ticket_${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "secondary_sales",
            filter: `token_id=eq.${id}`,
          },
          (payload) => {
            console.log("Real-time secondary sale update:", payload)
            if (isMounted.current) {
              // Invalidate cache and refetch
              invalidateTicketCaches(null, Number(id))
              fetchTicketDetails()
            }
          },
        )
        .subscribe()

      channelRef.current = [channel, salesChannel]
    } catch (error) {
      console.error("Error setting up real-time listener:", error)
    }

    return () => {
      isMounted.current = false

      // Clean up the subscriptions
      if (channelRef.current) {
        try {
          channelRef.current.forEach((channel) => {
            supabase.removeChannel(channel)
          })
        } catch (error) {
          console.error("Error removing channels:", error)
        }
      }
    }
  }, [id, fetchTicketDetails])

  // Validate resale price
  const validateResalePrice = useCallback(() => {
    if (!ticket || !resalePriceEth) return { isValid: false, error: "Please enter a price" }

    const priceValue = parseFloat(resalePriceEth)
    
    if (isNaN(priceValue) || priceValue <= 0) {
      return { isValid: false, error: "Please enter a valid price greater than zero" }
    }

    // Convert original price to ETH for comparison
    const originalPriceInEth = inrToEth(ticket.price)
    
    if (priceValue <= originalPriceInEth) {
      return { 
        isValid: false, 
        error: `Resale price must be greater than original price (${originalPriceInEth.toFixed(6)} ETH)` 
      }
    }

    return { isValid: true, error: null }
  }, [ticket, resalePriceEth])

  // Handle listing ticket for resale
  const handleListForSale = useCallback(async () => {
    if (!ticket || !address) return

    // Validate owner
    if (ticket.owner_address.toLowerCase() !== address.toLowerCase()) {
      toast({
        title: "Not authorized",
        description: "You can only list tickets that you own.",
        variant: "destructive",
      })
      return
    }

    // Validate price
    const validation = validateResalePrice()
    if (!validation.isValid) {
      toast({
        title: "Invalid price",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    const priceInEth = parseFloat(resalePriceEth)
    const priceInInr = ethToInr(priceInEth)

    try {
      setListingStatus({ status: "preparing", message: "Preparing to list ticket..." })

      // List the ticket
      await listTicketForSale(
        {
          ticketId: ticket.ticket_id,
          tokenId: ticket.token_id,
          eventId: ticket.event_id,
          sellerAddress: address,
          originalPrice: ticket.price,
          resalePrice: priceInInr, // Convert back to INR for storage
        },
        setListingStatus,
      )

      // Close dialog on success
      if (listingStatus.status === "success") {
        setDialogOpen(false)
        // Invalidate cache and refetch
        invalidateTicketCaches(ticket.event_id, ticket.token_id)
        fetchTicketDetails()
        toast({
          title: "Success",
          description: "Ticket listed for resale successfully!",
        })
      }
    } catch (error) {
      console.error("Error listing ticket:", error)
      setListingStatus({ 
        status: "error", 
        message: error.message || "Failed to list ticket for resale" 
      })
    }
  }, [ticket, resalePriceEth, address, toast, fetchTicketDetails, validateResalePrice, listingStatus.status])

  // Handle cancelling listing
  const handleCancelListing = useCallback(async () => {
    if (!ticket || !address) return

    // Validate owner
    if (ticket.owner_address.toLowerCase() !== address.toLowerCase()) {
      toast({
        title: "Not authorized",
        description: "You can only cancel listings for tickets that you own.",
        variant: "destructive",
      })
      return
    }

    try {
      setCancelStatus({ status: "preparing", message: "Preparing to cancel listing..." })

      // Cancel the listing
      await delistTicketFromSale(ticket.token_id, setCancelStatus)

      // Update UI based on final status
      if (cancelStatus.status === "success") {
        // Invalidate cache and refetch
        invalidateTicketCaches(ticket.event_id, ticket.token_id)
        fetchTicketDetails()
        toast({
          title: "Success",
          description: "Ticket listing cancelled successfully!",
        })
      }
    } catch (error) {
      console.error("Error cancelling listing:", error)
      setCancelStatus({ 
        status: "error", 
        message: error.message || "Failed to cancel listing" 
      })
    }
  }, [ticket, address, toast, fetchTicketDetails, cancelStatus.status])

  // Handle sharing ticket
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ticket for ${ticket?.event_name}`,
          text: `Check out my ticket for ${ticket?.event_name} on ${new Date(ticket?.event_date || "").toLocaleDateString()}`,
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
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

  // Handle price input change
  const handlePriceChange = (e) => {
    const value = e.target.value
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setResalePriceEth(value)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Ticket</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Not found state
  if (!ticket) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
            <CardDescription>
              The ticket you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Format date for display
  const formattedDate = new Date(ticket.event_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Generate QR code data
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

  // Check if user is the owner
  const isOwner = address && ticket.owner_address.toLowerCase() === address.toLowerCase()

  // Calculate prices for display
  const originalPriceInEth = inrToEth(ticket.price)
  const resalePriceInInr = resalePriceEth ? ethToInr(parseFloat(resalePriceEth)) : 0
  const validation = validateResalePrice()

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
                  <Badge variant={ticket.for_sale ? "destructive" : "outline"} className="text-sm">
                    {ticket.for_sale ? "For Sale" : "Valid"}
                  </Badge>
                  {ticket.for_sale && ticket.resale_price && (
                    <Badge variant="secondary" className="text-sm">
                      Resale: {inrToEth(ticket.resale_price).toFixed(6)} ETH
                    </Badge>
                  )}
                  {!isOwner && (
                    <Badge variant="outline" className="text-sm">
                      Not Owner
                    </Badge>
                  )}
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
                  <User className="h-5 w-5 mr-2 text-primary" />
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
                    <p className="text-sm text-muted-foreground">Original Price</p>
                    <p className="font-medium">
                      {originalPriceInEth.toFixed(6)} ETH (₹{ticket.price.toLocaleString()})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{new Date(ticket.purchase_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  ticket.for_sale ? (
                    <Button
                      variant="destructive"
                      onClick={handleCancelListing}
                      disabled={
                        cancelStatus.status !== "idle" &&
                        cancelStatus.status !== "success" &&
                        cancelStatus.status !== "error"
                      }
                      className="flex-1"
                    >
                      {cancelStatus.status === "preparing"
                        ? "Preparing..."
                        : cancelStatus.status === "wallet-confirm"
                          ? "Confirm in Wallet..."
                          : cancelStatus.status === "blockchain-pending"
                            ? "Confirming..."
                            : cancelStatus.status === "blockchain-success"
                              ? "Updating..."
                              : cancelStatus.status === "database-pending"
                                ? "Finalizing..."
                                : "Cancel Listing"}
                    </Button>
                  ) : (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1">
                          <Tag className="mr-2 h-4 w-4" />
                          List for Resale
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>List Ticket for Resale</DialogTitle>
                          <DialogDescription>
                            Set a price for your ticket in ETH. Once listed, it will be available for purchase by other users.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="resalePrice" className="text-right">
                              Price (ETH)
                            </Label>
                            <Input
                              id="resalePrice"
                              type="text"
                              value={resalePriceEth}
                              onChange={handlePriceChange}
                              className="col-span-3"
                              placeholder="0.000000"
                              step="0.000001"
                            />
                          </div>
                          
                          {/* Price conversion display */}
                          {resalePriceEth && !isNaN(parseFloat(resalePriceEth)) && (
                            <div className="text-sm text-muted-foreground">
                              ≈ ₹{resalePriceInInr.toLocaleString()}
                            </div>
                          )}

                          {/* Original price reference */}
                          <div className="text-sm text-muted-foreground">
                            Original price: {originalPriceInEth.toFixed(6)} ETH (₹{ticket.price.toLocaleString()})
                          </div>

                          {/* Validation error */}
                          {!validation.isValid && resalePriceEth && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{validation.error}</AlertDescription>
                            </Alert>
                          )}

                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                              A 2.5% platform fee will be deducted from the final sale price. 
                              Resale price must be greater than the original price.
                            </AlertDescription>
                          </Alert>

                          {listingStatus.status !== "idle" && listingStatus.status !== "success" && (
                            <Alert variant={listingStatus.status === "error" ? "destructive" : "default"}>
                              <AlertTitle>{listingStatus.status === "error" ? "Error" : "Status"}</AlertTitle>
                              <AlertDescription>{listingStatus.message}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={listingStatus.status === "preparing" || 
                                     listingStatus.status === "wallet-confirm" || 
                                     listingStatus.status === "blockchain-pending"}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleListForSale}
                            disabled={
                              !validation.isValid ||
                              listingStatus.status === "preparing" ||
                              listingStatus.status === "wallet-confirm" ||
                              listingStatus.status === "blockchain-pending" ||
                              listingStatus.status === "database-pending"
                            }
                          >
                            {listingStatus.status === "preparing"
                              ? "Preparing..."
                              : listingStatus.status === "wallet-confirm"
                                ? "Confirm in Wallet..."
                                : listingStatus.status === "blockchain-pending"
                                  ? "Confirming..."
                                  : listingStatus.status === "blockchain-success"
                                    ? "Updating..."
                                    : listingStatus.status === "database-pending"
                                      ? "Finalizing..."
                                      : "List Ticket"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/market/purchase/${ticket.token_id}`)}
                    disabled={!ticket.for_sale}
                  >
                    {ticket.for_sale ? "Purchase Ticket" : "Not For Sale"}
                  </Button>
                )}

                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 flex flex-col items-start">
              <p className="text-sm text-muted-foreground mb-1">Ticket ID</p>
              <p className="font-mono text-xs">{ticket.id}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">Owner Address</p>
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
                  {/* Event Details */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{ticket.event_name}</h3>
                    <p className="text-sm text-gray-700">
                      {formattedDate} | {ticket.event_time}
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="w-48 h-48 bg-white flex items-center justify-center mb-4 p-2 border border-gray-300 rounded">
                    <QRCodeSVG
                      value={qrCodeData}
                      size={180}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/logo.png",
                        height: 24,
                        width: 24,
                        excavate: true,
                      }}
                    />
                  </div>

                  {/* Ticket Info */}
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
                  : "Present this ticket at the venue entrance"}
              </p>
            </CardFooter>
          </Card>

          {/* Additional information card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Verification Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                This ticket is secured by blockchain technology. The QR code contains a unique signature that can be
                verified at the venue.
              </p>
              <div className="mt-4 text-xs">
                <p className="font-semibold">Verification Steps:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Present the QR code at the venue entrance</li>
                  <li>Staff will scan the code to verify authenticity</li>
                  <li>Once verified, you'll be granted entry</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
