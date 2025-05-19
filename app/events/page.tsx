"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Filter } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllEvents } from "@/lib/contract"

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("upcoming")
  const [statusFilter, setStatusFilter] = useState("active")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await getAllEvents()
        setEvents(allEvents)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    if (!status) return "outline"

    switch (status.toLowerCase()) {
      case "active":
        return "success"
      case "canceled":
      case "cancelled":
        return "destructive"
      case "inactive":
        return "outline"
      case "expired":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Function to get display text for status
  const getStatusDisplayText = (status: string) => {
    if (!status) return "Unknown"

    switch (status.toLowerCase()) {
      case "canceled":
      case "cancelled":
        return "Cancelled"
      case "inactive":
        return "Inactive"
      case "active":
        return "Active"
      case "expired":
        return "Expired"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Filter events based on search term, category, date, and status
  const filteredEvents = events.filter((event) => {
    // Search filter
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())

    // Category filter
    const matchesCategory = categoryFilter === "all" || event.category?.toLowerCase() === categoryFilter.toLowerCase()

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (event.status === "active" || !event.status)) ||
      event.status?.toLowerCase() === statusFilter.toLowerCase()

    // Date filter
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isToday = eventDate.toDateString() === today.toDateString()

    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const isThisWeek = eventDate >= today && eventDate <= nextWeek

    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    const isThisMonth = eventDate >= today && eventDate <= nextMonth

    const isUpcoming = eventDate >= today

    let matchesDate = true
    if (dateFilter === "today") matchesDate = isToday
    else if (dateFilter === "week") matchesDate = isThisWeek
    else if (dateFilter === "month") matchesDate = isThisMonth
    else if (dateFilter === "upcoming") matchesDate = isUpcoming

    return matchesSearch && matchesCategory && matchesDate && matchesStatus
  })

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Browse and purchase tickets for upcoming events.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-[180px]">
            <Select defaultValue="all" value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[180px]">
            <Select defaultValue="upcoming" value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[180px]">
            <Select defaultValue="active" value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={event.event_image_url || "/placeholder.svg?height=200&width=400"}
                    alt={event.name}
                    className="object-cover w-full h-full transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{event.name}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge>{event.category || "Event"}</Badge>
                      <Badge variant={getStatusBadgeVariant(event.status)}>{getStatusDisplayText(event.status)}</Badge>
                    </div>
                  </div>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 opacity-70" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 opacity-70" />
                      <span>
                        {event.time ||
                          new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 opacity-70" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center font-bold mt-2">Price: {event.ticketPrice} ETH</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/events/${event.id}`} className="w-full">
                    <Button className="w-full">View Event</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
