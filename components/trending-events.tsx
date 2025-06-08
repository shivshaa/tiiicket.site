"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Tag, TrendingUp, Zap, Flame } from "lucide-react"
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
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.3
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
  }

  const trendingIcons = [Flame, Zap, TrendingUp]

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-gray-800">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-orange-500/10" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-grey-400/20 to-black-400/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="container relative z-10">
        <motion.div 
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Trending Icon with Animation */}
          <motion.div 
            className="relative mb-6"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 shadow-2xl relative">
              <Flame className="h-8 w-8 text-white" />
              
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 blur-lg opacity-60 -z-10" />
              
              {/* Sparkle Effects */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-300 rounded-full"
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>
          </motion.div>

          <motion.h2 
            className="text-5xl md:text-6xl font-black tracking-tight mb-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-yellow-400 via-red-400 to-white-400 bg-clip-text text-transparent">
              Trending
            </span>{" "}
            <span className="text-white">Events</span>
          </motion.h2>
          
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent flex-1" />
            <TrendingUp className="h-5 w-5 text-orange-400" />
            <div className="h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent flex-1" />
          </motion.div>
          
          <motion.p 
            className="text-gray-300 text-lg font-medium max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            The hottest events everyone's talking about
          </motion.p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, i) => (
              <motion.div 
                key={i} 
                className="h-[380px] bg-white/5 backdrop-blur-sm animate-pulse rounded-3xl border border-white/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {events.map((event, index) => {
              const IconComponent = trendingIcons[index % trendingIcons.length]
              
              return (
                <motion.div
                  key={event.id}
                  variants={item}
                  whileHover={{
                    y: -20,
                    rotateX: 5,
                    rotateY: 5,
                    scale: 1.02,
                    transition: { 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20 
                    }
                  }}
                  className="group relative"
                >
                  <Link href={`/events/${event.id}`}>
                    <Card className="overflow-hidden h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-purple-500/20 relative">
                      {/* Trending Rank Badge */}
                      <div className="absolute -top-3 -left-3 z-30">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-sm">#{index + 1}</span>
                          </div>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-md opacity-60"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.6, 0.8, 0.6]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </div>
                      </div>

                      {/* Trending Icon */}
                      <div className="absolute top-4 right-4 z-20">
                        <motion.div
                          className="p-2 bg-gradient-to-r from-orange-500/80 to-red-500/80 backdrop-blur-sm rounded-full"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <IconComponent className="h-4 w-4 text-white" />
                        </motion.div>
                      </div>

                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        />
                        
                        {/* Dynamic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-purple-900/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-pink-500/10 group-hover:from-orange-500/20 group-hover:to-pink-500/20 transition-all duration-500" />
                        
                        {/* Animated Glow Line */}
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-400 to-red-400"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: index * 0.1 }}
                        />

                        {/* Badges */}
                        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2">
                          <Badge className="bg-black/60 text-white text-xs backdrop-blur-sm border border-white/20 px-3 py-1">
                            {event.category}
                          </Badge>
                          <Badge className={`text-xs px-3 py-1 ${getStatusBadgeVariant(event.status)}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6 relative">
                        <motion.h3 
                          className="text-xl font-bold line-clamp-2 mb-4 text-white group-hover:text-orange-100 transition-colors duration-300"
                          whileHover={{ scale: 1.02 }}
                        >
                          {event.title}
                        </motion.h3>
                        
                        <div className="flex flex-col gap-3 text-sm">
                          <motion.div 
                            className="flex items-center text-gray-300 group-hover:text-white transition-colors duration-300"
                            whileHover={{ x: 5 }}
                          >
                            <Calendar className="h-4 w-4 mr-3 text-orange-400" />
                            <span>
                              {new Date(event.date).toLocaleDateString("en-IN", { 
                                weekday: "short", 
                                day: "numeric", 
                                month: "short" 
                              })} • {event.time}
                            </span>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center text-gray-300 group-hover:text-white transition-colors duration-300"
                            whileHover={{ x: 5 }}
                          >
                            <MapPin className="h-4 w-4 mr-3 text-orange-400" />
                            <span className="line-clamp-1">{event.location}</span>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center text-gray-300 group-hover:text-white transition-colors duration-300"
                            whileHover={{ x: 5 }}
                          >
                            <Tag className="h-4 w-4 mr-3 text-orange-400" />
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">{event.price}</span>
                              <span className="text-xs text-gray-400">
                                ₹{event.priceInr.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-6 pt-0">
                        <Button
                          size="sm"
                          className="w-full text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white 
                                   hover:from-orange-600 hover:to-red-600 transition-all duration-300 
                                   shadow-lg hover:shadow-xl hover:shadow-orange-500/25 border-0
                                   font-semibold tracking-wide"
                        >
                          Join the Trend
                        </Button>
                      </CardFooter>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-3xl" />
                        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/20 inline-block mb-6">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Trending Events</h3>
              <p className="text-gray-400">Check back soon for hot new events</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </section>
  )
}
