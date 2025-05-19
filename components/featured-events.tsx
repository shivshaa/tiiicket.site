"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWallet } from "@/components/wallet-provider"
import { AnimatedEventCard } from "@/components/animated-event-card"
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
}

export function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useWallet()

  useEffect(() => {
    // Simulate fetching events from API
    const fetchEvents = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        setEvents([
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
        ])
        setIsLoading(false)
      }, 1000)
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

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <motion.div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Featured Events</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Discover upcoming events and secure your tickets with blockchain technology.
            </p>
          </div>
        </motion.div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-start pt-8">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg"></div>)
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {events.map((event) => (
                <AnimatedEventCard key={event.id} event={event} />
              ))}
            </motion.div>
          )}
        </div>
        <motion.div
          className="flex justify-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link href="/marketplace">
            <Button variant="outline" size="lg">
              View All Events
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
