"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, MapPin, Ticket, Users, AlertTriangle, ArrowLeftCircle, Ban } from "lucide-react"
import Link from "next/link"
import { getEventDetails, cancelEvent } from "@/lib/contract"
import { getEventById, updateEventStatus } from "@/lib/supabase"

export default function EventManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, connectWallet, address } = useWallet()
  const { toast } = useToast()
  const [event, setEvent] = useState<any>(null)
  const [supabaseEvent, setSupabaseEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push("/organizer/dashboard")
      return
    }

    const fetchEventDetails = async () => {
      try {
        const eventId = Number(params.id)
        const eventData = await getEventDetails(eventId)

        // Check if the user is the organizer
        if (eventData.organizer.toLowerCase() !== address?.toLowerCase()) {
          toast({
            title: "Unauthorized",
            description: "You are not the organizer of this event.",
            variant: "destructive",
          })
          router.push("/organizer/dashboard")
          return
        }

        setEvent(eventData)

        // Get additional details from Supabase
        try {
          const sbEvent = await getEventById(eventId.toString())
          if (sbEvent) {
            setSupabaseEvent(sbEvent)
          }
        } catch (error) {
          console.error("Error fetching Supabase event details:", error)
        }
      } catch (error) {
        console.error("Error fetching event details:", error)
        toast({
          title: "Error",
          description: "Failed to load event details. Please try again.",
          variant: "destructive",
        })
        router.push("/organizer/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchEventDetails()
  }, [isConnected, params.id, address, router, toast])

  const handleCancelEvent = async () => {
    if (!isConnected || !event) {
      return
    }

    setIsCancelling(true)

    try {
      // Call the blockchain contract to cancel the event
      await cancelEvent(event.id)

      // Update the event status in Supabase
      await updateEventStatus(event.id.toString(), "canceled")

      toast({
        title: "Event cancelled",
        description: "The event has been cancelled successfully.",
      })

      router.push("/organizer/dashboard")
    } catch (error) {
      console.error("Error cancelling event:", error)
      toast({
        title: "Error",
        description: "Failed to cancel the event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setIsDialogOpen(false)
    }
  }

  if (!isConnected) {
    return null // Redirecting in useEffect
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you're looking for doesn't exist or you don't have permission to manage it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/organizer/dashboard">Back to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/organizer/dashboard"
          className="flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeftCircle className="mr-2 h-5 w-5" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {new Date(event.date).toLocaleDateString()} • {event.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={event.active ? "default" : "destructive"}>{event.active ? "Active" : "Cancelled"}</Badge>

            {event.active && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Event</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this event? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <Alert variant="destructive" className="my-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Cancelling this event will prevent further ticket sales and may affect existing ticket holders.
                    </AlertDescription>
                  </Alert>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleCancelEvent} disabled={isCancelling}>
                      {isCancelling ? "Cancelling..." : "Yes, Cancel Event"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-primary" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      <span>{new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Ticket className="mr-2 h-5 w-5 text-primary" />
                      <span>Ticket Price: {event.ticketPrice} ETH</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-primary" />
                      <span>
                        Tickets Sold: {event.ticketsSold} / {event.maxTickets}
                      </span>
                    </div>
                    {supabaseEvent?.category && (
                      <div className="flex items-center">
                        <span className="mr-2 h-5 w-5 text-primary">🏷️</span>
                        <span>Category: {supabaseEvent.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tickets Sold</h3>
                    <p className="text-2xl font-bold">{event.ticketsSold}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Revenue</h3>
                    <p className="text-2xl font-bold">
                      {(Number(event.ticketPrice) * event.ticketsSold).toFixed(4)} ETH
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Remaining Tickets</h3>
                    <p className="text-2xl font-bold">{event.maxTickets - event.ticketsSold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Sales</CardTitle>
                <CardDescription>View all tickets sold for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Mock data for demonstration */}
                    <TableRow>
                      <TableCell className="font-medium">#1001</TableCell>
                      <TableCell>0x1a2b...3c4d</TableCell>
                      <TableCell>{new Date().toLocaleDateString()}</TableCell>
                      <TableCell>{event.ticketPrice} ETH</TableCell>
                      <TableCell>
                        <Badge>Valid</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">#1002</TableCell>
                      <TableCell>0x5e6f...7g8h</TableCell>
                      <TableCell>{new Date().toLocaleDateString()}</TableCell>
                      <TableCell>{event.ticketPrice} ETH</TableCell>
                      <TableCell>
                        <Badge variant="outline">Resale</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">#1003</TableCell>
                      <TableCell>0x9i0j...1k2l</TableCell>
                      <TableCell>{new Date().toLocaleDateString()}</TableCell>
                      <TableCell>{event.ticketPrice} ETH</TableCell>
                      <TableCell>
                        <Badge>Valid</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Track your event's financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Primary Sales</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tickets</span>
                          <span className="font-medium">{event.ticketsSold}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ticket Price</span>
                          <span className="font-medium">{event.ticketPrice} ETH</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="font-medium">Total Revenue</span>
                          <span className="font-bold">
                            {(Number(event.ticketPrice) * event.ticketsSold).toFixed(4)} ETH
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Secondary Sales</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resold Tickets</span>
                          <span className="font-medium">2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Royalties (10%)</span>
                          <span className="font-medium">0.02 ETH</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="font-medium">Total Royalties</span>
                          <span className="font-bold">0.02 ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {(Number(event.ticketPrice) * event.ticketsSold + 0.02).toFixed(4)} ETH
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Primary sales + secondary royalties</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
