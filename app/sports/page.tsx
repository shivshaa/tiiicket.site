"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, AlertCircle } from "lucide-react"
import { AnimatedEventCard } from "@/components/animated-event-card"
import { motion } from "framer-motion"
import { getEventsByCategory } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [sportType, setSportType] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [sportTypes, setSportTypes] = useState<string[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const sportsEvents = await getEventsByCategory("Sports")

        // Transform the data to match the expected format for AnimatedEventCard
        const formattedEvents = sportsEvents.map((event) => ({
          id: event.id,
          title: event.name,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          image: event.event_image_url || "/placeholder.svg?height=400&width=600",
          price: `${event.ticket_price} ETH`,
          category: event.category,
          sportType: event.subcategory || "General", // Use subcategory field if available
        }))

        // Extract unique sport types for the filter
        const types = Array.from(new Set(formattedEvents.map((event) => event.sportType))).filter(Boolean)
        setSportTypes(types)

        setEvents(formattedEvents)
        setFilteredEvents(formattedEvents)
      } catch (err) {
        console.error("Failed to fetch sports events:", err)
        setError("Failed to load sports events. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    // Filter events based on search query, date filter, and sport type
    const filtered = events.filter((event) => {
      const matchesSearch =
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())

      const eventDate = event.date ? new Date(event.date) : null
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)
      const nextMonth = new Date()
      nextMonth.setMonth(today.getMonth() + 1)

      let matchesDate = true
      if (dateFilter === "today" && eventDate) {
        matchesDate = eventDate.toDateString() === today.toDateString()
      } else if (dateFilter === "week" && eventDate) {
        matchesDate = eventDate >= today && eventDate <= nextWeek
      } else if (dateFilter === "month" && eventDate) {
        matchesDate = eventDate >= today && eventDate <= nextMonth
      }

      const matchesSportType = sportType === "all" || event.sportType === sportType

      return matchesSearch && matchesDate && matchesSportType
    })

    setFilteredEvents(filtered)
  }, [searchQuery, dateFilter, sportType, events])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <motion.div
          className="flex flex-col space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Sports Events</h1>
          <p className="text-muted-foreground">Browse and purchase tickets for upcoming sports events and matches.</p>
        </motion.div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          className="flex flex-col md:flex-row gap-4 items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex-1">
            <Input
              placeholder="Search sports events..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-[180px]">
            <Select value={sportType} onValueChange={setSportType}>
              <SelectTrigger>
                <SelectValue placeholder="Sport Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[180px]">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
              ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredEvents.map((event) => (
              <AnimatedEventCard key={event.id} event={event} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
