"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"
import { AnimatedEventCard } from "@/components/animated-event-card"
import { motion } from "framer-motion"

export default function SportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [sportType, setSportType] = useState("all")

  useEffect(() => {
    // Simulate fetching events from API
    const fetchEvents = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        const sportsEvents = [
          {
            id: "6",
            title: "Sports Championship Finals",
            description: "The ultimate showdown to crown this year's champions.",
            date: "2023-08-20",
            time: "3:00 PM",
            location: "National Stadium, Chicago",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.07 ETH",
            category: "Sports",
            sportType: "Basketball",
          },
          {
            id: "12",
            title: "NBA All-Star Game",
            description: "The best basketball players showcase their skills in this annual exhibition game.",
            date: "2023-07-30",
            time: "7:00 PM",
            location: "United Center, Chicago",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.09 ETH",
            category: "Sports",
            sportType: "Basketball",
          },
          {
            id: "13",
            title: "World Cup Qualifier Match",
            description: "Critical soccer match determining who advances to the World Cup.",
            date: "2023-08-15",
            time: "2:00 PM",
            location: "MetLife Stadium, New Jersey",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.06 ETH",
            category: "Sports",
            sportType: "Soccer",
          },
          {
            id: "14",
            title: "Tennis Grand Slam Finals",
            description: "Championship match of the most prestigious tennis tournament.",
            date: "2023-09-10",
            time: "1:00 PM",
            location: "Arthur Ashe Stadium, New York",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.11 ETH",
            category: "Sports",
            sportType: "Tennis",
          },
          {
            id: "15",
            title: "Formula 1 Grand Prix",
            description: "High-speed racing action on one of the most challenging circuits.",
            date: "2023-07-23",
            time: "12:00 PM",
            location: "Circuit of the Americas, Austin",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.15 ETH",
            category: "Sports",
            sportType: "Racing",
          },
          {
            id: "16",
            title: "Boxing Championship Fight",
            description: "Heavyweight title bout between the world's top contenders.",
            date: "2023-08-05",
            time: "9:00 PM",
            location: "MGM Grand, Las Vegas",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.12 ETH",
            category: "Sports",
            sportType: "Boxing",
          },
        ]
        setEvents(sportsEvents)
        setFilteredEvents(sportsEvents)
        setIsLoading(false)
      }, 1000)
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    // Filter events based on search query, date filter, and sport type
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
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Soccer">Soccer</SelectItem>
                <SelectItem value="Tennis">Tennis</SelectItem>
                <SelectItem value="Racing">Racing</SelectItem>
                <SelectItem value="Boxing">Boxing</SelectItem>
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

