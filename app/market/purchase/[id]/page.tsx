"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/components/wallet-provider"
import { LazyImage } from "@/components/ui/lazy-image"
import { Skeleton } from "@/components/ui/skeleton"
import { getTicketDetailsOptimized, invalidateTicketCaches } from "@/lib/marketplaceQueries"
import { buyResaleTicket } from "@/lib/contract"
import { buyTicketFromSecondaryMarket } from "@/lib/supabase"
import { ethToInr } from "@/lib/contract"
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Calendar, MapPin, Ticket, User, XCircle } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"

export default function PurchaseTicketPage() {
  const { id } = useParams()
  const router = useRouter()
  const { address, isConnected, connectWallet } = useWallet()
  const { toast } = useToast()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchaseStatus, setPurchaseStatus] = useState("idle") // idle, preparing, confirming, processing, success, error
  const [statusMessage, setStatusMessage] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const isMounted = useRef(true)

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
          description: "The ticket you're looking for doesn't exist or is no longer available.",
          variant: "destructive",
        })
        return
      }

      // Check if ticket is for sale
      if (!ticketData.for_sale) {
        setError("Ticket not for sale")
        toast({
          title: "Ticket not available",
          description: "This ticket is not currently listed for sale.",
          variant: "destructive",
        })
        return
      }

      setTicket(ticketData)
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
  }, [id, toast])

  // Initial data loading
  useEffect(() => {
    isMounted.current = true

    fetchTicketDetails()

    return () => {
      isMounted.current = false
    }
  }, [fetchTicketDetails])

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!ticket || !isConnected || !address) {
      if (!isConnected) {
        await connectWallet()
      }
      return
    }

    try {
      // Validate that buyer is not the seller
      if (ticket.owner_address.toLowerCase() === address.toLowerCase()) {
        toast({
          title: "Cannot purchase own ticket",
          description: "You cannot purchase your own ticket.",
          variant: "destructive",
        })
        return
      }

      // Start purchase process
      setPurchaseStatus("preparing")
      setStatusMessage("Preparing your purchase...")

      // Get sale details from secondary_sales table
      const { data: saleData, error: saleError } = await supabase
        .from("secondary_sales")
        .select("sale_id, resale_price, seller_address")
        .eq("token_id", ticket.token_id)
        .eq("status", "pending")
        .single()

      if (saleError || !saleData) {
        throw new Error("This ticket is no longer available for purchase")
      }

      // Prepare for blockchain transaction
      setPurchaseStatus("confirming")
      setStatusMessage("Please confirm the transaction in your wallet...")

      // Call blockchain function to buy ticket
      const result = await buyResaleTicket(ticket.token_id, saleData.resale_price.toString())

      // Update status
      setPurchaseStatus("processing")
      setStatusMessage("Transaction submitted. Waiting for confirmation...")
      setTransactionHash(result.tx.hash)

      // Wait for transaction confirmation
      const receipt = await result.tx.wait()

      // Update status
      setPurchaseStatus("updating")
      setStatusMessage("Transaction confirmed! Updating ownership records...")

      // Update database records
      await buyTicketFromSecondaryMarket(saleData.sale_id, ticket.token_id, address)

      // Invalidate caches
      invalidateTicketCaches(ticket.event_id, ticket.token_id)

      // Update status
      setPurchaseStatus("success")
      setStatusMessage("Purchase successful! The ticket is now yours.")

      // Show success toast
      toast({
        title: "Purchase successful",
        description: "You have successfully purchased this ticket!",
        variant: "success",
      })
    } catch (err) {
      console.error("Error purchasing ticket:", err)
      setPurchaseStatus("error")
      setStatusMessage(err.message || "Failed to purchase ticket. Please try again.")

      toast({
        title: "Purchase failed",
        description: err.message || "There was an error processing your purchase.",
        variant: "destructive",
      })
    }
  }, [ticket, isConnected, address, connectWallet, toast])

  // Format date
  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy")
    } catch (e) {
      return dateString || "TBA"
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Purchase Ticket</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Purchase Ticket</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Unable to Purchase Ticket
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error === "Ticket not found"
                    ? "The ticket you're trying to purchase doesn't exist or has been removed."
                    : error === "Ticket not for sale"
                      ? "This ticket is not currently listed for sale. It may have been purchased by someone else or removed from the marketplace."
                      : "There was an error processing your request. Please try again later."}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/market")} className="w-full">
                Return to Marketplace
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Not found state
  if (!ticket) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Purchase Ticket</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Not Found</CardTitle>
              <CardDescription>
                The ticket you're trying to purchase doesn't exist or is no longer available.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/market")} className="w-full">
                Return to Marketplace
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.back()}
          disabled={purchaseStatus !== "idle" && purchaseStatus !== "error" && purchaseStatus !== "success"}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Purchase Ticket</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Confirmation</CardTitle>
            <CardDescription>Review the details below before completing your purchase</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Ticket Preview */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3 aspect-video rounded-md overflow-hidden">
                  <LazyImage
                    src={ticket.event_data?.event_image_url || "/placeholder.svg?height=200&width=300"}
                    alt={ticket.event_data?.name || "Event"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{ticket.event_data?.name || "Event"}</h3>

                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDate(ticket.event_data?.date)}</span>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{ticket.event_data?.time || "TBA"}</span>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{ticket.event_data?.location || "TBA"}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center">
                      <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{ticket.category || "General"}</span>
                      {ticket.seat_info && (
                        <span className="ml-2 text-muted-foreground">- Seat: {ticket.seat_info}</span>
                      )}
                    </div>

                    <div className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-xs font-mono">
                        Seller: {ticket.owner_address.substring(0, 6)}...
                        {ticket.owner_address.substring(ticket.owner_address.length - 4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div>
              <h3 className="font-semibold mb-2">Price Details</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span>Ticket Price</span>
                  <span className="font-medium">{ticket.resale_price} ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>In INR</span>
                  <span>₹{ethToInr(ticket.resale_price).toLocaleString()}</span>
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span>{ticket.resale_price} ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>Gas fees not included</span>
                  <span>₹{ethToInr(ticket.resale_price).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Transaction Status */}
            {purchaseStatus !== "idle" && (
              <Alert
                variant={
                  purchaseStatus === "error" ? "destructive" : purchaseStatus === "success" ? "success" : "default"
                }
              >
                {purchaseStatus === "error" ? (
                  <XCircle className="h-4 w-4" />
                ) : purchaseStatus === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {purchaseStatus === "preparing"
                    ? "Preparing Purchase"
                    : purchaseStatus === "confirming"
                      ? "Wallet Confirmation"
                      : purchaseStatus === "processing"
                        ? "Processing Transaction"
                        : purchaseStatus === "updating"
                          ? "Updating Records"
                          : purchaseStatus === "success"
                            ? "Purchase Successful"
                            : purchaseStatus === "error"
                              ? "Purchase Failed"
                              : "Transaction Status"}
                </AlertTitle>
                <AlertDescription>
                  {statusMessage}

                  {transactionHash && (
                    <div className="mt-2 text-xs">
                      <span className="block">Transaction Hash:</span>
                      <code className="font-mono break-all">{transactionHash}</code>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {purchaseStatus === "success" ? (
              <>
                <Button onClick={() => router.push(`/tickets/${ticket.token_id}`)} className="w-full">
                  View My Ticket
                </Button>
                <Button variant="outline" onClick={() => router.push("/market")} className="w-full">
                  Return to Marketplace
                </Button>
              </>
            ) : purchaseStatus === "error" ? (
              <>
                <Button onClick={handlePurchase} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/market")} className="w-full">
                  Return to Marketplace
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handlePurchase}
                  disabled={purchaseStatus !== "idle" && purchaseStatus !== "error"}
                  className="w-full"
                >
                  {!isConnected
                    ? "Connect Wallet to Purchase"
                    : purchaseStatus === "preparing"
                      ? "Preparing..."
                      : purchaseStatus === "confirming"
                        ? "Confirm in Wallet..."
                        : purchaseStatus === "processing"
                          ? "Processing..."
                          : purchaseStatus === "updating"
                            ? "Finalizing..."
                            : "Complete Purchase"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By clicking "Complete Purchase", you agree to our terms and conditions for ticket resale.
                </p>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
