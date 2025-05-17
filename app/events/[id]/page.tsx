"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function EventPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { isConnected, connectWallet } = useWallet()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState("1")
  const [ticketType, setTicketType] = useState("general")
  const [isLoading, setIsLoading] = useState(false)

  // In a real app, this would be fetched from an API
  const event = {
    id,
    title: "Summer Music Festival",
    description:
      "A three-day music festival featuring top artists from around the world. Join us for an unforgettable weekend of music, food, and fun in the heart of New York City.",
    longDescription:
      "The Summer Music Festival is the premier music event of the season, bringing together artists from various genres for three days of non-stop entertainment. From rock to pop, hip-hop to electronic, there's something for everyone. The festival will feature multiple stages, food vendors, art installations, and more. Don't miss this opportunity to see your favorite artists live and discover new music in a vibrant atmosphere.",
    date: "2023-07-15",
    endDate: "2023-07-17",
    time: "12:00 PM",
    location: "Central Park, New York",
    venue: "Great Lawn",
    address: "Central Park, New York, NY 10024",
    image: "/placeholder.svg?height=600&width=1200",
    price: "0.05 ETH",
    category: "Music",
    organizer: "NYC Events Co.",
    ticketTypes: [
      { id: "general", name: "General Admission", price: "0.05 ETH", available: 500 },
      { id: "vip", name: "VIP Access", price: "0.15 ETH", available: 100 },
      { id: "backstage", name: "Backstage Pass", price: "0.3 ETH", available: 20 },
    ],
    totalTickets: 620,
    soldTickets: 243,
  }

  const handleBuyTicket = async () => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    setIsLoading(true)

    // Simulate blockchain transaction
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Purchase successful!",
        description: `You've purchased ${quantity} ${event.ticketTypes.find((t) => t.id === ticketType)?.name} ticket(s) for ${event.title}.`,
      })
    }, 2000)
  }

  const selectedTicket = event.ticketTypes.find((t) => t.id === ticketType)

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-lg overflow-hidden">
            <img
              src={event.image || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-auto object-cover aspect-video"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <div className="flex items-center mt-2 space-x-2">
              <Badge>{event.category}</Badge>
              <span className="text-sm text-muted-foreground">Organized by {event.organizer}</span>
            </div>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="venue">Venue</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  <span>
                    {new Date(event.date).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  <span>Starts at {event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Ticket className="mr-2 h-5 w-5 text-primary" />
                  <span>
                    {event.soldTickets} / {event.totalTickets} tickets sold
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">About This Event</h3>
                <p className="text-muted-foreground">{event.longDescription}</p>
              </div>
            </TabsContent>
            <TabsContent value="venue" className="space-y-4 pt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{event.venue}</h3>
                <p className="text-muted-foreground">{event.address}</p>
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
                  Central Park is accessible via multiple subway lines. The closest stations are 5th Ave/59th St (N, R,
                  W), 57th St (F), and 59th St-Columbus Circle (A, B, C, D, 1).
                </p>
              </div>
            </TabsContent>
            <TabsContent value="tickets" className="space-y-4 pt-4">
              <div className="space-y-4">
                {event.ticketTypes.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader>
                      <CardTitle>{ticket.name}</CardTitle>
                      <CardDescription>{ticket.available} tickets available</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-bold text-lg">{ticket.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Purchase Tickets</CardTitle>
              <CardDescription>Secure your spot with NFT tickets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ticket Type</label>
                <Select value={ticketType} onValueChange={setTicketType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.ticketTypes.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        {ticket.name} - {ticket.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quantity" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <div className="flex justify-between py-2">
                  <span>Price per ticket:</span>
                  <span>{selectedTicket?.price}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between py-2 font-bold">
                  <span>Total:</span>
                  <span>{Number.parseFloat(selectedTicket?.price || "0") * Number.parseInt(quantity)} ETH</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleBuyTicket} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Processing...
                  </>
                ) : isConnected ? (
                  "Buy Tickets"
                ) : (
                  "Connect Wallet to Purchase"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

