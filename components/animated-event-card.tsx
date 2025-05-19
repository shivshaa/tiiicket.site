"use client"

import { CardFooter } from "@/components/ui/card"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Tag } from "lucide-react"
import { motion } from "framer-motion"

type Event = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  image: string
  price: string
  category: string
  status?: string
}

interface AnimatedEventCardProps {
  event: Event
}

// Function to get badge variant based on status
const getStatusBadgeVariant = (status: string) => {
  if (!status) return "outline"

  switch (status?.toLowerCase()) {
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
  if (!status) return "Active"

  switch (status?.toLowerCase()) {
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

export function AnimatedEventCard({ event }: AnimatedEventCardProps) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={item} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
      <Link href={`/events/${event.id}`}>
        <Card className="overflow-hidden h-full">
          <div className="relative h-36 overflow-hidden">
            <img
              src={event.image || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{event.title}</CardTitle>
              <div className="flex flex-col gap-1">
                <motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ duration: 0.2 }}>
                  <Badge>{event.category}</Badge>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, rotate: -3 }} transition={{ duration: 0.2 }}>
                  <Badge variant={getStatusBadgeVariant(event.status)}>{getStatusDisplayText(event.status)}</Badge>
                </motion.div>
              </div>
            </div>
            <CardDescription>{event.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-col space-y-1 text-xs">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="line-clamp-1">{event.date}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="line-clamp-1">{event.price}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-3 pt-0">
            <Button size="sm" className="w-full text-xs">
              View Event
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
