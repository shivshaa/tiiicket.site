"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"
import { AnimatedEventCard } from "@/components/animated-event-card"
import { motion } from "framer-motion"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"

export default function MarketplacePage() {
  const { isConnected, connectWallet } = useWallet()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  useEffect(() => {
    // Simulate fetching events from API
    const fetchEvents = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        const allEvents = [
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
            id: "2",
            title: "Tech Conference 2023",
            description: "The biggest tech conference of the year with keynotes from industry leaders.",
            date: "2023-08-10",
            time: "9:00 AM",
            location: "Convention Center, San Francisco",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.08 ETH",
            category: "Conference",
          },
          {
            id: "3",
            title: "Art Exhibition Opening",
            description: "Exclusive opening night for the new contemporary art exhibition.",
            date: "2023-06-25",
            time: "7:00 PM",
            location: "Modern Art Gallery, London",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.03 ETH",
            category: "Art",
          },
          {
            id: "4",
            title: "Comedy Night Special",
            description: "An evening of laughter with the best stand-up comedians in town.",
            date: "2023-07-05",
            time: "8:00 PM",
            location: "Laugh Factory, Los Angeles",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.02 ETH",
            category: "Entertainment",
          },
          {
            id: "5",
            title: "Blockchain Summit",
            description: "Connect with blockchain experts and enthusiasts from around the globe.",
            date: "2023-09-12",
            time: "10:00 AM",
            location: "Crypto Center, Miami",
            image: "/placeholder.svg?height=400&width=600",
            price: "0.1 ETH",
            category: "Conference",
          },
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
        ]
        setEvents(allEvents)
        setFilteredEvents(allEvents)
        setIsLoading(false)
      }, 1000)
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    // Filter events based on search query and category
    let filtered = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter

      return matchesSearch && matchesCategory
    })

    // Sort events
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "price-asc") {
        return Number.parseFloat(a.price) - Number.parseFloat(b.price)
      } else if (sortBy === "price-desc") {
        return Number.parseFloat(b.price) - Number.parseFloat(a.price)
      } else if (sortBy === "name-asc") {
        return a.title.localeCompare(b.title)
      } else if (sortBy === "name-desc") {
        return b.title.localeCompare(a.title)
      }
      return 0
    })

    setFilteredEvents(filtered)
  }, [searchQuery, categoryFilter, sortBy, events])

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
          <h1 className="text-3xl font-bold tracking-tight">All Events Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and purchase tickets for all upcoming events across categories.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row gap-4 items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-[180px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Art">Art</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[180px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Soonest)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
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
            {Array(9)
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

