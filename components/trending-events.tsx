"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Tag } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { getTrendingEvents } from "@/lib/supabase"
import { ethToInr } from "@/lib/contract"

export function TrendingEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const trendingEvents = await getTrendingEvents(6)

        const formattedEvents = trendingEvents
          .filter((event) => {
            const eventDate = new Date(event.date)
            const now = new Date()
            return event.status === "active" && eventDate >= now
          })
          .map((event) => ({
            id: event.id,
            title: event.name,
            description: event.description,
            date: new Date(event.date).toISOString().split("T")[0],
            time: event.time.slice(0, 5),
            location: event.location,
            image: event.event_image_url || "/placeholder.svg",
            price: `${event.ticket_price} ETH`,
            priceInr: ethToInr(event.ticket_price),
            category: event.category || "Event",
            status: event.status,
          }))

        setEvents(formattedEvents)
      } catch (error) {
        console.error("Error fetching trending events:", error)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "canceled":
      case "cancelled":
        return "destructive"
      case "inactive":
        return "bg-yellow-500 text-black"
      case "active":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <section className="py-12 bg-black to-muted/50">
      <div className="container">
        <div className="flex flex-col items-start text-left mb-10">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.828 14.828a4 4 0 01-5.656-5.656L12 6l2.828 2.828a4 4 0 010 5.656z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 13l3 3L20 8"
              />
            </svg>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
              Trending Events
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Don’t miss what’s hot and happening near you
          </p>
        </div>


        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-[260px] bg-muted animate-pulse rounded-xl"></div>
              ))}
          </div>
        ) : events.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {events.map((event) => (
              <motion.div
                key={event.id}
                variants={item}
                whileHover={{
                  scale: 1.03,
                  rotateY: 3,
                  rotateX: 2,
                  boxShadow: "0 12px 25px rgba(0, 0, 0, 0.15)",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <Link href={`/events/${event.id}`}>
                  <Card className="overflow-hidden h-full rounded-2xl border border-muted/20 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md hover:shadow-xl transition-all duration-300">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />
                      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                        <Badge variant="secondary" className="text-xs bg-primary/80 text-white shadow-sm px-2 py-0.5">
                          {event.category}
                        </Badge>
                        <Badge className={`text-xs ${getStatusBadgeVariant(event.status)} px-2 py-0.5`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold line-clamp-1">{event.title}</h3>
                      <div className="mt-2 text-sm space-y-1 text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} • {event.time}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1 text-yellow-600" />
                          <span>{event.price}</span>
                          <span className="text-xs text-muted-foreground ml-1">(₹{event.priceInr.toLocaleString("en-IN")})</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-2">
                      <Button
                        size="sm"
                        className="w-full text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No upcoming events found</h3>
            <p className="text-muted-foreground">Check back later for new events</p>
          </div>
        )}
      </div>
    </section>
  )
}
