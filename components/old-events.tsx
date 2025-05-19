"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Tag } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { getAllEvents } from "@/lib/supabase"
import { ethToInr } from "@/lib/contract"

export function OldEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const allEvents = await getAllEvents()

        const formattedEvents = allEvents
          .filter((event) => {
            const eventDate = new Date(event.date)
            const now = new Date()
            return (
              eventDate < now ||
              event.status === "canceled" ||
              event.status === "inactive" ||
              event.status === "cancelled"
            )
          })
          .map((event) => {
            return {
              id: event.id,
              title: event.name,
              description: event.description,
              date: new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
              time: new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              location: event.location,
              image: event.event_image_url || "/placeholder.svg",
              price: `${event.ticket_price} ETH`,
              priceInr: ethToInr(event.ticket_price),
              category: event.category || "Event",
              status: event.status || "past",
            }
          })

        setEvents(formattedEvents)
      } catch (error) {
        console.error("Error fetching past events:", error)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "canceled":
      case "cancelled":
        return "destructive"
      case "inactive":
        return "outline"
      case "past":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <section className="py-12 bg-black to-muted/50">
      <div className="container">
        <div className="flex flex-col items-start text-left mb-10">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
              Past Events
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Relive the memories of past events
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-[250px] bg-muted/40 animate-pulse rounded-xl backdrop-blur-sm"></div>
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
                whileHover={{ scale: 1.03, rotateY: 4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Link href={`/events/${event.id}`}>
                  <Card className="overflow-hidden h-full bg-grey/70 backdrop-blur-md border border-muted/30 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg">
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                        <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                          {event.category}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(event.status)} className="text-xs">
                          {event.status === "canceled" || event.status === "cancelled"
                            ? "Cancelled"
                            : event.status === "inactive"
                              ? "Inactive"
                              : "Past"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-base font-semibold line-clamp-1 mb-2 text-foreground">
                        {event.title}
                      </h3>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          {event.price} <span className="ml-1 text-xs">(₹{event.priceInr.toLocaleString("en-IN")})</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-2">
                      <Button size="sm" className="w-full text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600">
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
            <h3 className="text-lg font-medium">No past events found</h3>
            <p className="text-muted-foreground">Check back later for new events</p>
          </div>
        )}
      </div>
    </section>
  )
}
