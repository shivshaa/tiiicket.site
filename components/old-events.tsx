"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Tag, Clock } from "lucide-react"
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
        delayChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "canceled":
      case "cancelled":
        return "bg-red-500/80"
      case "inactive":
        return "bg-gray-500/80"
      case "past":
        return "bg-blue-500/80"
      default:
        return "bg-gray-500/80"
    }
  }

  return (
    <section className="py-16 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <div className="container relative">
        <motion.div 
          className="flex flex-col items-start text-left mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
              Past Events
            </h2>
          </div>
          <motion.div
            className="h-1 w-24 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mb-3"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <p className="text-gray-400 text-lg font-medium">
            Memories from events that have concluded
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <motion.div 
                key={i} 
                className="h-[280px] bg-gray-800/40 animate-pulse rounded-2xl backdrop-blur-sm border border-gray-700/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                variants={item}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  rotateX: 2,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: index * 0.05 
                }}
                className="group"
              >
                <Link href={`/events/${event.id}`}>
                  <Card className="overflow-hidden h-full bg-gray-900/60 backdrop-blur-lg border border-gray-700/40 rounded-2xl transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-gray-600/60 relative">
                    {/* Status Indicator */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(event.status)} z-20`} />
                    
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover scale-105 transition-all duration-700 ease-out
                                 filter grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:brightness-110"
                      />
                      
                      {/* Overlay gradients */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 group-hover:to-black/10 transition-all duration-500" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                        <Badge 
                          variant="secondary" 
                          className="bg-black/70 text-white text-xs backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:bg-black/50"
                        >
                          {event.category}
                        </Badge>
                        <Badge 
                          variant={getStatusBadgeVariant(event.status)} 
                          className="text-xs backdrop-blur-sm transition-all duration-300"
                        >
                          {event.status === "canceled" || event.status === "cancelled"
                            ? "Cancelled"
                            : event.status === "inactive"
                              ? "Inactive"
                              : "Past"}
                        </Badge>
                      </div>

                      {/* Vintage Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/5 to-orange-200/5 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500" />
                    </div>
                    
                    <CardContent className="p-5 relative">
                      <h3 className="text-lg font-bold line-clamp-2 mb-3 text-white group-hover:text-blue-100 transition-colors duration-300">
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.date}</span>
                        </div>
                        <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{event.price}</span>
                            <span className="text-xs text-gray-500">₹{event.priceInr.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-5 pt-0">
                      <Button 
                        size="sm" 
                        className="w-full text-sm bg-gradient-to-r from-gray-700 to-gray-800 text-white 
                                 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 
                                 shadow-lg hover:shadow-xl border border-gray-600/30 hover:border-gray-500/50"
                      >
                        View Details
                      </Button>
                    </CardFooter>

                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-4 rounded-2xl bg-gray-900/60 backdrop-blur-lg border border-gray-700/40 inline-block mb-4">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No past events found</h3>
            <p className="text-gray-400">Check back later for concluded events</p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
