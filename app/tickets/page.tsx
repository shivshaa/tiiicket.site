"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, QrCode, Send, DollarSign } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function TicketsPage() {
  const { isConnected, connectWallet, address } = useWallet()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upcoming")
  const [isLoading, setIsLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  // In a real app, this data would come from an API
  const tickets = {
    upcoming: [
      {
        id: "1",
        eventId: "1",
        eventTitle: "Summer Music Festival",
        date: "2023-07-15",
        time: "12:00 PM",
        location: "Central Park, New York",
        image: "/placeholder.svg?height=400&width=600",
        price: "0.05 ETH",
        category: "Music",
        ticketType: "General Admission",
        seat: "General Admission",
        tokenId: "12345",
      },
      {
        id: "2",
        eventId: "2",
        eventTitle: "Tech Conference 2023",
        date: "2023-08-10",
        time: "9:00 AM",
        location: "Convention Center, San Francisco",
        image: "/placeholder.svg?height=400&width=600",
        price: "0.08 ETH",
        category: "Conference",
        ticketType: "General Admission",
        seat: "General Admission",
        tokenId: "23456",
      },
    ],
    past: [
      {
        id: "3",
        eventId: "3",
        eventTitle: "Art Exhibition Opening",
        date: "2023-05-25",
        time: "7:00 PM",
        location: "Modern Art Gallery, London",
        image: "/placeholder.svg?height=400&width=600",
        price: "0.03 ETH",
        category: "Art",
        ticketType: "General Admission",
        seat: "General Admission",
        tokenId: "34567",
      },
    ],
  }

  const handleTransferTicket = async (recipientAddress: string) => {
    setIsLoading(true)

    // Simulate blockchain transaction
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Transfer successful!",
        description: `You've transferred ticket #${selectedTicket.id} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}.`,
      })
    }, 2000)
  }

  const handleListForSale = async (price: string) => {
    setIsLoading(true)

    // Simulate blockchain transaction
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Ticket listed!",
        description: `You've listed ticket #${selectedTicket.id} for sale at ${price} ETH.`,
      })
    }, 2000)
  }

  const handleShowQR = (ticket: any) => {
    setSelectedTicket(ticket)
    setShowQR(true)
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

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">View, transfer, and manage your NFT tickets</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.upcoming.map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <CardTitle>{ticket.eventTitle}</CardTitle>
                    <CardDescription>{ticket.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <img src={ticket.image || "/placeholder.svg"} alt={ticket.eventTitle} className="rounded-md" />
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(ticket.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{ticket.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{ticket.location}</span>
                    </div>
                    <Badge>{ticket.ticketType}</Badge>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button onClick={() => handleShowQR(ticket)}>
                      <QrCode className="mr-2 h-4 w-4" /> View QR Code
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Send className="mr-2 h-4 w-4" /> Transfer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Transfer Ticket</DialogTitle>
                          <DialogDescription>
                            Enter the recipient's wallet address to transfer this ticket.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">
                              To
                            </Label>
                            <Input id="address" defaultValue={address} className="col-span-3" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={() => handleTransferTicket(address || "")}
                            disabled={isLoading}
                          >
                            {isLoading ? "Transferring..." : "Transfer Ticket"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <DollarSign className="mr-2 h-4 w-4" /> List for Sale
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>List Ticket for Sale</DialogTitle>
                          <DialogDescription>Enter the price you want to list this ticket for.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                              Price (ETH)
                            </Label>
                            <Input id="price" defaultValue="0.1" className="col-span-3" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={() => handleListForSale("0.1")} disabled={isLoading}>
                            {isLoading ? "Listing..." : "List Ticket"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.past.map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <CardTitle>{ticket.eventTitle}</CardTitle>
                    <CardDescription>{ticket.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <img src={ticket.image || "/placeholder.svg"} alt={ticket.eventTitle} className="rounded-md" />
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(ticket.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{ticket.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{ticket.location}</span>
                    </div>
                    <Badge>
                      {ticket.ticketType} - {ticket.seat}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ticket QR Code</DialogTitle>
              <DialogDescription>Show this QR code at the event entrance.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket?.tokenId}`}
                alt="QR Code"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

