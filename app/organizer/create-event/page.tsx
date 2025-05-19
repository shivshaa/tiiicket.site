"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEvent } from "@/lib/contract"
import { createEventMetadata, getIPFSGatewayURL } from "@/lib/ipfs"
import { addEvent } from "@/lib/supabase"

export default function CreateEventPage() {
  const { isConnected, connectWallet, address } = useWallet()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isBlockchainProcessing, setIsBlockchainProcessing] = useState(false)
  const [isDatabaseProcessing, setIsDatabaseProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState("")
  const [ticketPrice, setTicketPrice] = useState("0.01")
  const [maxTickets, setMaxTickets] = useState("1000")
  const [category, setCategory] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      await connectWallet()
      return
    }

    // Validate form
    if (!name || !description || !date || !time || !location || !ticketPrice || !maxTickets || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!imageFile) {
      toast({
        title: "Missing image",
        description: "Please upload an event image.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert date and time to Unix timestamp
      const eventDate = new Date(`${date}T${time}:00`)
      const timestamp = Math.floor(eventDate.getTime() / 1000)

      // Upload image to IPFS
      setIsUploading(true)
      toast({
        title: "Uploading image",
        description: "Please wait while we upload your event image to IPFS...",
      })

      let imageUrl = ""
      let eventURI = ""

      try {
        // Create event metadata and upload to IPFS
        const { metadataURI, imageURI } = await createEventMetadata(
          {
            name,
            description,
            date: timestamp,
            location,
            ticketPrice,
            maxTickets: Number.parseInt(maxTickets),
            category,
            organizer: address || "unknown",
          },
          imageFile,
        )

        eventURI = metadataURI
        imageUrl = getIPFSGatewayURL(imageURI)

        console.log("Event metadata uploaded to IPFS:", eventURI)
        console.log("Image URL:", imageUrl)
        setIsUploading(false)
      } catch (error) {
        console.error("Error uploading to IPFS:", error)
        toast({
          title: "IPFS upload failed",
          description: "Failed to upload to IPFS. Using placeholder instead.",
          variant: "destructive",
        })
        // Use a placeholder image if upload fails
        imageUrl = "/placeholder.svg?height=600&width=1200"
        eventURI = `https://example.com/event/${Date.now()}`
        setIsUploading(false)
      }

      // Create event on blockchain
      setIsBlockchainProcessing(true)
      toast({
        title: "Creating event on blockchain",
        description: "Please confirm the transaction in your wallet...",
      })

      let eventId = 0
      let blockchainSuccess = false
      let txHash = ""

      try {
        const tx = await createEvent(
          name,
          description,
          timestamp,
          location,
          ticketPrice,
          Number.parseInt(maxTickets),
          eventURI,
        )

        toast({
          title: "Transaction submitted",
          description: "Waiting for blockchain confirmation...",
        })

        const receipt = await tx.wait()
        txHash = receipt.hash || tx.hash

        // Try to extract the event ID from the transaction receipt
        console.log("Transaction receipt:", receipt)

        // For now, we'll use a timestamp as a fallback
        eventId = Date.now()
        blockchainSuccess = true

        toast({
          title: "Blockchain transaction successful",
          description: "Your event has been created on the blockchain.",
        })

        console.log("Event created on blockchain with ID:", eventId)
        setIsBlockchainProcessing(false)
      } catch (error) {
        console.error("Error creating event on blockchain:", error)
        toast({
          title: "Blockchain transaction failed",
          description: "Failed to create event on blockchain. Please try again.",
          variant: "destructive",
        })
        setIsBlockchainProcessing(false)
        setIsSubmitting(false)
        // Exit early if blockchain transaction fails
        return
      }

      // Only proceed to database storage if blockchain transaction was successful
      if (blockchainSuccess) {
        setIsDatabaseProcessing(true)
        toast({
          title: "Saving event details",
          description: "Storing event information in our database...",
        })

        // Prepare event data for Supabase
        const eventData = {
          organizer_id: address || "unknown",
          name: name,
          description: description,
          date: new Date(date).toISOString().split("T")[0],
          time: time + ":00",
          location: location,
          event_image_url: imageUrl,
          ipfsuri: eventURI,
          ticket_price: Number.parseFloat(ticketPrice),
          max_tickets: Number.parseInt(maxTickets),
          blockchain_id: eventId.toString(),
          createdat: new Date().toISOString(),
          category: category,
          status: "active",
          transaction_hash: txHash,
        }

        console.log("Event data:", eventData)
        await addEvent(eventData)
        console.log("Event added to Supabase")
        setIsDatabaseProcessing(false)

        toast({
          title: "Event created successfully!",
          description: "Your event has been created and is now live.",
          variant: "success",
        })

        router.push("/organizer/dashboard")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      setIsBlockchainProcessing(false)
      setIsDatabaseProcessing(false)
    }
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

        <form onSubmit={handleCreateEvent}>
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Provide the basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Event Category</Label>
                <Select value={category} onValueChange={setCategory} required disabled={isSubmitting}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Festival">Festival</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event"
                  className="min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter event location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price (ETH)</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTickets">Maximum Tickets</Label>
                  <Input
                    id="maxTickets"
                    type="number"
                    min="1"
                    value={maxTickets}
                    onChange={(e) => setMaxTickets(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Event Image</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Event preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center ${isSubmitting ? "opacity-50" : "cursor-pointer"}`}
                    onClick={isSubmitting ? undefined : handleImageClick}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Drag and drop an image, or click to browse</p>
                    <p className="text-xs text-muted-foreground">Recommended size: 1200 x 600 pixels</p>
                    <Input
                      id="image"
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                    <Button variant="outline" size="sm" className="mt-4" type="button" disabled={isSubmitting}>
                      Upload Image
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/organizer/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    {isUploading
                      ? "Uploading..."
                      : isBlockchainProcessing
                        ? "Creating on Blockchain..."
                        : isDatabaseProcessing
                          ? "Saving Event..."
                          : "Processing..."}
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
