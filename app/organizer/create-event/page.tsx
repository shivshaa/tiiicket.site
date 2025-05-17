"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Plus, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CreateEventPage() {
  const { isConnected, connectWallet } = useWallet()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [ticketTypes, setTicketTypes] = useState([{ id: 1, name: "General Admission", price: "0.05", quantity: "500" }])

  const handleAddTicketType = () => {
    const newId = ticketTypes.length > 0 ? Math.max(...ticketTypes.map((t) => t.id)) + 1 : 1
    setTicketTypes([...ticketTypes, { id: newId, name: "", price: "", quantity: "" }])
  }

  const handleRemoveTicketType = (id: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((t) => t.id !== id))
    } else {
      toast({
        title: "Cannot remove",
        description: "You must have at least one ticket type",
        variant: "destructive",
      })
    }
  }

  const handleTicketTypeChange = (id: number, field: string, value: string) => {
    setTicketTypes(ticketTypes.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      await connectWallet()
      return
    }

    setIsSubmitting(true)

    // Simulate blockchain transaction
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      })
      router.push("/organizer/dashboard")
    }, 2000)
  }

  if (!isConnected) {
    return (
      <div className="container py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create Event</CardTitle>
            <CardDescription>Connect your wallet to create a new event</CardDescription>
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
      <div className="flex flex-col space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
          <p className="text-muted-foreground">Create a new event and mint NFT tickets</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          <form onSubmit={handleCreateEvent}>
            <TabsContent value="basic" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Provide the basic information about your event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" placeholder="Enter event title" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Event Description</Label>
                    <Textarea id="description" placeholder="Describe your event" className="min-h-[100px]" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select defaultValue="music">
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue Name</Label>
                      <Input id="venue" placeholder="Enter venue name" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="Enter event location" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input id="start-date" type="date" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input id="end-date" type="date" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Start Time</Label>
                      <Input id="time" type="time" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Event Image</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Drag and drop an image, or click to browse</p>
                      <p className="text-xs text-muted-foreground">Recommended size: 1200 x 600 pixels</p>
                      <Input id="image" type="file" className="hidden" />
                      <Button variant="outline" size="sm" className="mt-4">
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button">
                    Save as Draft
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("tickets")}>
                    Next: Tickets
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Configuration</CardTitle>
                  <CardDescription>Set up the different types of tickets for your event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {ticketTypes.map((ticket, index) => (
                    <div key={ticket.id} className="space-y-4">
                      {index > 0 && <Separator />}
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Ticket Type {index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleRemoveTicketType(ticket.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`ticket-name-${ticket.id}`}>Name</Label>
                          <Input
                            id={`ticket-name-${ticket.id}`}
                            placeholder="e.g. General Admission"
                            value={ticket.name}
                            onChange={(e) => handleTicketTypeChange(ticket.id, "name", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ticket-price-${ticket.id}`}>Price (ETH)</Label>
                          <Input
                            id={`ticket-price-${ticket.id}`}
                            placeholder="0.05"
                            type="number"
                            step="0.001"
                            min="0"
                            value={ticket.price}
                            onChange={(e) => handleTicketTypeChange(ticket.id, "price", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ticket-quantity-${ticket.id}`}>Quantity</Label>
                          <Input
                            id={`ticket-quantity-${ticket.id}`}
                            placeholder="100"
                            type="number"
                            min="1"
                            value={ticket.quantity}
                            onChange={(e) => handleTicketTypeChange(ticket.id, "quantity", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" className="w-full" onClick={handleAddTicketType}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Ticket Type
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => setActiveTab("basic")}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("advanced")}>
                    Next: Advanced Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Configure additional settings for your NFT tickets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="royalty">Secondary Sale Royalty (%)</Label>
                    <Input id="royalty" type="number" min="0" max="20" defaultValue="10" />
                    <p className="text-xs text-muted-foreground">
                      Percentage of secondary sales that goes back to you as the event organizer
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price-cap">Secondary Sale Price Cap (%)</Label>
                    <Input id="price-cap" type="number" min="0" max="200" defaultValue="50" />
                    <p className="text-xs text-muted-foreground">
                      Maximum percentage above original price that tickets can be resold for (0 = no limit)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-lock">Transfer Lock Period</Label>
                    <Select defaultValue="none">
                      <SelectTrigger id="transfer-lock">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No lock period</SelectItem>
                        <SelectItem value="1day">24 hours after purchase</SelectItem>
                        <SelectItem value="1week">1 week after purchase</SelectItem>
                        <SelectItem value="event">Until 24 hours before event</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Period during which tickets cannot be transferred after purchase
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="metadata">Additional Metadata</Label>
                    <Textarea
                      id="metadata"
                      placeholder="Enter any additional metadata as JSON"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Add custom metadata to your NFT tickets in JSON format
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => setActiveTab("tickets")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Creating Event...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </div>
  )
}

