"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"
import { AnimatedEventCard } from "@/components/animated-event-card"
import { motion } from "framer-motion"

export default function MusicPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    // Simulate fetching events from API
    const fetchEvents = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        const musicEvents = [
          {
            id: "1",
            title: "Summer Music Festival",
            description: "A three-day music festival featuring top artists from around the world.",
            date: "2023-07-15",
            time: "12:00 PM",
            location: "Central Park, New York",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.05 ETH",
            category: "Music",
          },
          {
            id: "7",
            title: "Jazz Night Special",
            description: "An evening of smooth jazz with renowned musicians in an intimate setting.",
            date: "2023-07-22",
            time: "8:00 PM",
            location: "Blue Note, New York",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.03 ETH",
            category: "Music",
          },
          {
            id: "8",
            title: "Rock Legends Reunion",
            description: "Legendary rock bands reunite for one special night of classic hits.",
            date: "2023-08-05",
            time: "7:30 PM",
            location: "Madison Square Garden, New York",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.12 ETH",
            category: "Music",
          },
          {
            id: "9",
            title: "Electronic Music Showcase",
            description: "The best DJs and electronic music producers in one epic night.",
            date: "2023-07-29",
            time: "10:00 PM",
            location: "Warehouse District, Los Angeles",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.04 ETH",
            category: "Music",
          },
          {
            id: "10",
            title: "Classical Symphony Orchestra",
            description: "A night of classical masterpieces performed by a world-class orchestra.",
            date: "2023-08-12",
            time: "6:00 PM",
            location: "Symphony Hall, Boston",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.06 ETH",
            category: "Music",
          },
          {
            id: "11",
            title: "Hip Hop Summit",
            description: "Celebrating hip hop culture with performances from top artists.",
            date: "2023-09-02",
            time: "4:00 PM",
            location: "Barclays Center, Brooklyn",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.07 ETH",
            category: "Music",
          },
        ]
        setEvents(musicEvents)
        setFilteredEvents(musicEvents)
        setIsLoading(false)
      }, 1000)
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    // Filter events based on search query and date filter
    const filtered = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())

      const eventDate = new Date(event.date)
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)
      const nextMonth = new Date()
      nextMonth.setMonth(today.getMonth() + 1)

      let matchesDate = true
      if (dateFilter === "today") {
        matchesDate = eventDate.toDateString() === today.toDateString()
      } else if (dateFilter === "week") {
        matchesDate = eventDate >= today && eventDate <= nextWeek
      } else if (dateFilter === "month") {
        matchesDate = eventDate >= today && eventDate <= nextMonth
      }

      return matchesSearch && matchesDate
    })

    setFilteredEvents(filtered)
  }, [searchQuery, dateFilter, events])

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
          <h1 className="text-3xl font-bold tracking-tight">Music Events</h1>
          <p className="text-muted-foreground">Browse and purchase tickets for upcoming music events and concerts.</p>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row gap-4 items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex-1">
            <Input
              placeholder="Search music events..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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

