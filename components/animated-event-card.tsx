"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Ticket } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/components/wallet-provider"

type EventCardProps = {
  event: {
    id: string
    title: string
    description: string
    date: string
    time: string
    location: string
    image: string
    price: string
    category: string
  }
}

export function AnimatedEventCard({ event }: EventCardProps) {
  const { isConnected } = useWallet()
  const [isHovered, setIsHovered] = useState(false)

  // Get appropriate image based on category and event ID to ensure uniqueness
  const getEventImage = (category: string, id: string) => {
    // Use the event ID to ensure unique images
    const imageMap: Record<string, string> = {
      // Music events
      "1": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "7": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "8": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "9": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "10": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "11": "https://images.unsplash.com/photo-1506157786151-b8491531f063?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",

      // Sports events
      "6": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "12": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "13": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "14": "https://images.unsplash.com/photo-1622279457486-28f993f814e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "15": "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "16": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",

      // Conference events
      "2": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      "5": "https://images.unsplash.com/photo-1591115765373-5207764f72e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",

      // Art events
      "3": "https://images.unsplash.com/photo-1531913764164-f85c52d7e6a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",

      // Entertainment events
      "4": "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
    }

    // If we have a specific image for this event ID, use it
    if (imageMap[id]) {
      return imageMap[id]
    }

    // Otherwise, fall back to category-based images
    switch (category.toLowerCase()) {
      case "music":
        return "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
      case "conference":
        return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
      case "art":
        return "https://images.unsplash.com/photo-1531913764164-f85c52d7e6a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
      case "sports":
        return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
      case "entertainment":
        return "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
      default:
        return event.image || "/placeholder.svg?height=400&width=600"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full" // Ensure the motion div takes full height
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="aspect-video w-full overflow-hidden">
          <motion.img
            src={getEventImage(event.category, event.id)}
            alt={event.title}
            className="object-cover w-full h-full"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{event.title}</CardTitle>
            <motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ duration: 0.2 }}>
              <Badge>{event.category}</Badge>
            </motion.div>
          </div>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex flex-col space-y-2 text-sm">
            <motion.div
              className="flex items-center"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">
                {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </motion.div>
            <motion.div
              className="flex items-center"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Clock className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">{event.time}</span>
            </motion.div>
            <motion.div
              className="flex items-center"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MapPin className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">{event.location}</span>
            </motion.div>
            <motion.div
              className="flex items-center mt-1"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Ticket className="mr-2 h-4 w-4 text-primary" />
              <span className="font-bold">{event.price}</span>
            </motion.div>
          </div>
        </CardContent>
        <CardFooter>
          <Link href={`/events/${event.id}`} className="w-full">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="w-full">{isConnected ? "Buy Ticket" : "View Details"}</Button>
            </motion.div>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

