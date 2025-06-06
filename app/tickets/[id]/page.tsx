"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ShieldCheck, User2, Wallet, MapPin, Calendar, Clock, Ticket as TicketIcon, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  fetchTicketById,
  buyResaleTicket,
  listTicketForSale,
  delistTicketFromSale,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Import wallet hook
import { useWallet } from "@/components/wallet-provider"

interface Ticket {
  ticket_id: string
  event_id: string
  owner_address: string
  price: number
  category: string
  token_uri: string
  token_id: number
  purchase_date: string
  seat_info: string
  event_name: string
  image_url: string
  qr_code: string
  for_sale: boolean
  resale_price: number | null
  event: {
    id: number
    name: string
    description: string
    date: string
    time: string
    location: string
    event_image_url: string
    organizer_id: string
    category: string
    status: string
  }
  owner: {
    username: string
    email: string
  }
}

// QR Code data structure for verification
interface QRCodeData {
  ticketId: string
  eventId: string
  tokenId: number
  ownerAddress: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  seatInfo: string
  category: string
  purchaseDate: string
  isValid: boolean
  blockchainHash?: string
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
  const [qrCodeData, setQrCodeData] = useState<string>("")

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

  // Generate QR code data
  const generateQRCodeData = (ticketData: Ticket): string => {
    const qrData: QRCodeData = {
      ticketId: ticketData.ticket_id,
      eventId: ticketData.event_id,
      tokenId: ticketData.token_id,
      ownerAddress: ticketData.owner_address,
      eventName: ticketData.event_name,
      eventDate: ticketData.event.date,
      eventTime: ticketData.event.time,
      location: ticketData.event.location,
      seatInfo: ticketData.seat_info,
      category: ticketData.category,
      purchaseDate: ticketData.purchase_date,
      isValid: ticketData.event.status === 'active',
      blockchainHash: ticketData.token_uri
    }
    return JSON.stringify(qrData)
  }

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
      
      // Generate QR code data
      const qrData = generateQRCodeData(ticket)
      setQrCodeData(qrData)
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

  // Format date and time
  const formatDateTime = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`)
    return {
      date: eventDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: eventDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
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
      const priceInEth = (ticket.resale_price || ticket.price).toString()

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

  // Generate QR code URL (using qr-server.com for demo - replace with your preferred QR service)
  const getQRCodeUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-8 w-64" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-96" />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* QR Code Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
            <CardDescription>The requested ticket could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const priceDisplay = formatPriceDisplay(ticket.resale_price || ticket.price)
  const dateTime = formatDateTime(ticket.event.date, ticket.event.time)

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Ticket Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative">
              {ticket.event.event_image_url && (
                <div className="h-64 overflow-hidden">
                  <img
                    src={ticket.event.event_image_url}
                    alt={ticket.event_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge variant={ticket.event.status === 'active' ? 'default' : 'secondary'}>
                  {ticket.event.status}
                </Badge>
                {ticket.for_sale && (
                  <Badge variant="destructive">For Sale</Badge>
                )}
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-2xl">{ticket.event_name}</CardTitle>
              <CardDescription className="text-base">{ticket.event.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{dateTime.date}</p>
                    <p className="text-sm text-muted-foreground">{dateTime.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{ticket.event.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <TicketIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Seat Info</p>
                    <p className="text-sm text-muted-foreground">{ticket.seat_info || 'General Admission'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="h-5">
                    {ticket.category}
                  </Badge>
                  <div>
                    <p className="font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">Token ID: {ticket.token_id}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Owner Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Ownership Details</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {ticket.owner.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{ticket.owner.username || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {ticket.owner_address.slice(0, 6)}...{ticket.owner_address.slice(-4)}
                    </p>
                  </div>
                  {address && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Your Wallet</p>
                      <p className="text-sm font-mono">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Purchase Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Purchase Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Purchased: {new Date(ticket.purchase_date).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Original Price: {formatPriceDisplay(ticket.price).eth} ({formatPriceDisplay(ticket.price).inr})
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Current Price</h4>
                  <p className="text-lg font-bold text-primary">
                    {priceDisplay.eth}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {priceDisplay.inr}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Actions</h3>
                {!address ? (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-2">Connect your wallet to interact with this ticket</p>
                  </div>
                ) : address.toLowerCase() === ticket.owner_address.toLowerCase() ? (
                  <div className="space-y-3">
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
                            <DialogFooter>
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
                    )}
                    
                    {/* Transfer Section */}
                    <div className="space-y-2">
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
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleBuyTicket} 
                    disabled={isBuying || !ticket.for_sale}
                    size="lg"
                  >
                    {isBuying ? "Buying..." : ticket.for_sale ? `Buy Ticket (${priceDisplay.eth})` : "Not for Sale"}
                  </Button>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="bg-muted/20 border-t">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Blockchain Secured</span>
                </div>
                <Badge variant="outline">
                  ID: {ticket.ticket_id.slice(0, 8)}...
                </Badge>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* QR Code Card */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Verification QR</span>
              </CardTitle>
              <CardDescription>
                Scan this code for ticket verification
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <img
                  src={getQRCodeUrl(qrCodeData)}
                  alt="Ticket QR Code"
                  className="w-full max-w-48 mx-auto"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Contains: Ticket ID, Event Details,</p>
                <p>Owner Info, Blockchain Hash</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeData)
                  toast({
                    title: "Copied!",
                    description: "QR code data copied to clipboard",
                  })
                }}
              >
                Copy QR Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TicketDetails
