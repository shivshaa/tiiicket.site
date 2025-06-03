"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ShieldCheck, User2, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  fetchTicketById,
  buyTicketBlockchainFirst,
  listTicketForSaleBlockchainFirst,
  delistTicketFromSaleBlockchainFirst,
  transferTicketBlockchainFirst,
  ethToInr,
} from "@/lib/contract"
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
import { Separator } from "@/components/ui/separator"

// Import wallet hook
import { useWallet } from "@/components/wallet-provider"

interface Ticket {
  id: string
  token_id: number
  event_id: string
  price: number
  owner_address: string
  is_valid: boolean
  for_sale: boolean
  event: {
    name: string
    description: string
    start_time: string
    end_time: string
  }
}

const TicketDetails = () => {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { address, isConnected } = useWallet()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBuying, setIsBuying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferAddress, setTransferAddress] = useState("")
  const [transferAddressError, setTransferAddressError] = useState("")

  // Resale dialog state
  const [isResaleDialogOpen, setIsResaleDialogOpen] = useState(false)
  const [resalePriceEth, setResalePriceEth] = useState("")
  const [resalePriceError, setResalePriceError] = useState("")
  const [isListing, setIsListing] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTicket()
    }
  }, [params.id])

  const fetchTicket = async () => {
    if (!params.id) {
      toast({
        title: "Error",
        description: "Missing ticket ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const ticket = await fetchTicketById(params.id as string)
      setTicket(ticket)
    } catch (error: any) {
      console.error("Error fetching ticket:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch ticket",
        variant: "destructive",
      })
      router.push("/tickets")
    } finally {
      setIsLoading(false)
    }
  }

  // Format ETH price display
  const formatEthPrice = (price: number): string => {
    return `${price.toFixed(6)} ETH`
  }

  // Format price with both ETH and INR
  const formatPriceDisplay = (priceInEth: number) => {
    const inrValue = ethToInr(priceInEth)
    return {
      eth: formatEthPrice(priceInEth),
      inr: `₹${inrValue.toLocaleString("en-IN")}`,
    }
  }

  const handleBuyTicket = async () => {
    if (!ticket) {
      toast({
        title: "Error",
        description: "Missing ticket information",
        variant: "destructive",
      })
      return
    }

    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setIsBuying(true)

    try {
      const priceInEth = ticket.price.toString()

      await buyTicketBlockchainFirst(ticket.token_id, priceInEth, address, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })

      // Refresh ticket data after successful purchase
      await fetchTicket()
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
    if (!ticket) {
      toast({
        title: "Error",
        description: "Missing ticket information",
        variant: "destructive",
      })
      return
    }

    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    setIsCancelling(true)

    try {
      await delistTicketFromSaleBlockchainFirst(ticket.token_id, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })

      // Refresh ticket data after successful cancellation
      await fetchTicket()
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

  const validateAddress = (address: string): boolean => {
    if (!address || address.trim() === "") {
      setTransferAddressError("Please enter an address")
      return false
    }

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!ethAddressRegex.test(address)) {
      setTransferAddressError("Invalid Ethereum address")
      return false
    }

    setTransferAddressError("")
    return true
  }

  const handleTransferTicket = async () => {
    if (!ticket) {
      toast({
        title: "Error",
        description: "Missing ticket information",
        variant: "destructive",
      })
      return
    }

    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    if (!validateAddress(transferAddress)) {
      return
    }

    setIsTransferring(true)

    try {
      await transferTicketBlockchainFirst(ticket.token_id, address, transferAddress, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })

      // Refresh ticket data and clear transfer address
      await fetchTicket()
      setTransferAddress("")
    } catch (error: any) {
      console.error("Error transferring ticket:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to transfer ticket",
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
    }
  }

  // Improved ETH validation function
  const validateEthPrice = (value: string): boolean => {
    if (!value || value.trim() === "") {
      setResalePriceError("Please enter a price")
      return false
    }

    // Allow only numbers and one decimal point
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

    // Reasonable upper limit for ETH price
    if (numValue > 1000) {
      setResalePriceError("Price cannot exceed 1000 ETH")
      return false
    }

    // Check for minimum meaningful price (0.000001 ETH)
    if (numValue < 0.000001) {
      setResalePriceError("Price must be at least 0.000001 ETH")
      return false
    }

    setResalePriceError("")
    return true
  }

  // Handle listing for resale
  const handleListForResale = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!validateEthPrice(resalePriceEth)) {
      return
    }

    if (!ticket || !address) {
      toast({
        title: "Error",
        description: "Missing ticket or wallet information",
        variant: "destructive",
      })
      return
    }

    setIsListing(true)

    try {
      await listTicketForSaleBlockchainFirst(ticket.token_id, resalePriceEth, address, (status) => {
        toast({
          title: status.status === "success" ? "Success!" : "Status Update",
          description: status.message,
          variant: status.status === "error" ? "destructive" : "default",
        })
      })

      // Close dialog and refresh ticket data
      setIsResaleDialogOpen(false)
      setResalePriceEth("")
      setResalePriceError("")
      await fetchTicket()
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

  // Handle dialog close
  const handleDialogClose = () => {
    if (!isListing) {
      setIsResaleDialogOpen(false)
      setResalePriceEth("")
      setResalePriceError("")
    }
  }

  // Handle price input change with INR preview
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setResalePriceEth(value)

    if (value && value.trim() !== "") {
      validateEthPrice(value)
    } else {
      setResalePriceError("")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-64" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-96" />
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                <Skeleton className="h-6 w-48" />
              </h3>
              <div className="text-sm text-muted-foreground">
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                <Skeleton className="h-6 w-48" />
              </h3>
              <div className="text-sm text-muted-foreground">
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
            <CardDescription>The requested ticket could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const priceDisplay = formatPriceDisplay(ticket.price)

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{ticket.event.name}</CardTitle>
          <CardDescription>{ticket.event.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Event Details</h3>
            <div className="text-sm text-muted-foreground">
              {new Date(ticket.event.start_time).toLocaleString()} - {new Date(ticket.event.end_time).toLocaleString()}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Ticket Information</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Token ID: {ticket.token_id}</Badge>
              {ticket.is_valid ? (
                <Badge variant="outline">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">Invalid</Badge>
              )}
              {ticket.for_sale && (
                <Badge variant="default">
                  For Sale: {priceDisplay.eth} ({priceDisplay.inr})
                </Badge>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Ownership</h3>
            <div className="flex items-center space-x-2">
              <User2 className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Owner: {ticket.owner_address}</span>
            </div>
            {address && (
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Your Address: {address}</span>
              </div>
            )}
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Actions</h3>
            {!address ? (
              <div className="text-sm text-muted-foreground">
                Please connect your wallet to interact with this ticket.
              </div>
            ) : address.toLowerCase() === ticket.owner_address.toLowerCase() ? (
              <>
                {ticket.for_sale ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelListing}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Listing"}
                  </Button>
                ) : (
                  <>
                    <Dialog open={isResaleDialogOpen} onOpenChange={handleDialogClose}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsResaleDialogOpen(true)
                          }}
                          disabled={ticket?.for_sale || isListing}
                        >
                          {ticket?.for_sale ? "Already Listed" : "List for Resale"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>List Ticket for Resale</DialogTitle>
                          <DialogDescription>
                            Set your resale price in ETH. The price will be used directly on the blockchain marketplace.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleListForResale} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="resale-price">Resale Price (ETH)</Label>
                            <div className="relative">
                              <Input
                                id="resale-price"
                                type="text"
                                placeholder="0.002"
                                value={resalePriceEth}
                                onChange={handlePriceChange}
                                className={`pr-12 ${resalePriceError ? "border-red-500" : ""}`}
                                disabled={isListing}
                                autoComplete="off"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                ETH
                              </span>
                            </div>
                            {resalePriceError && <div className="text-sm text-red-500">{resalePriceError}</div>}
                            {resalePriceEth && !resalePriceError && (
                              <div className="text-sm text-muted-foreground">
                                ≈ ₹{ethToInr(Number.parseFloat(resalePriceEth)).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            <div className="font-medium mb-1">
                              Original Price: {priceDisplay.eth} ({priceDisplay.inr})
                            </div>
                            <div className="text-muted-foreground">
                              Set your resale price. All transactions are processed on the blockchain first.
                            </div>
                          </div>
                          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isListing}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isListing || !!resalePriceError || !resalePriceEth.trim()}>
                              {isListing ? "Listing..." : "List for Resale"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <div className="grid gap-2">
                      <Label htmlFor="transfer-address">Transfer Ticket</Label>
                      <Input
                        id="transfer-address"
                        type="text"
                        placeholder="0x..."
                        value={transferAddress}
                        onChange={(e) => {
                          setTransferAddress(e.target.value)
                          if (e.target.value && e.target.value.trim() !== "") {
                            validateAddress(e.target.value)
                          } else {
                            setTransferAddressError("")
                          }
                        }}
                        className={cn({ "border-red-500": transferAddressError })}
                      />
                      {transferAddressError && <div className="text-sm text-red-500">{transferAddressError}</div>}
                      <Button
                        className="w-full"
                        onClick={handleTransferTicket}
                        disabled={isTransferring || !!transferAddressError || !transferAddress.trim()}
                      >
                        {isTransferring ? "Transferring..." : "Transfer"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Button className="w-full" onClick={handleBuyTicket} disabled={isBuying || !ticket.for_sale}>
                {isBuying ? "Buying..." : ticket.for_sale ? `Buy Ticket (${priceDisplay.eth})` : "Not for Sale"}
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Blockchain Secured</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Price: {priceDisplay.eth} ({priceDisplay.inr})
          </span>
        </CardFooter>
      </Card>
    </div>
  )
}

export default TicketDetails
