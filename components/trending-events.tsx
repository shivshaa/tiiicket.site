"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWallet } from "@/components/wallet-provider"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export function TrendingEvents() {
  const [events, setEvents] = useState<{ sports: Event[]; music: Event[] }>({
    sports: [],
    music: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useWallet()

  useEffect(() => {
    // Simulate fetching events from API
    const fetchEvents = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        setEvents({
          sports: [
            {
              id: "s1",
              title: "MI vs CSK",
              description: "TATA IPL Match #14.",
              date: "2025-04-20",
              time: "7:30 PM",
              location: "Wankhede Stadium, Mumbai",
              image:
                "https://d2al04l58v9bun.cloudfront.net/blog/wp-content/uploads/2024/04/12143945/IPL-2024-Match-29-MI-vs-CSK-Astrology-Predictions.jpg?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
              price: "0.09 ETH",
              category: "Sports",
            },
            {
              id: "s2",
              title: "Mumbai City FC vs Bengaluru FC ",
              description: "The Indian Super League is the men's highest level of the Indian football league system.",
              date: "2025-03-16",
              time: "7:30 PM",
              location: "DY Patil Stadium, Navi Mumbai",
              image:
                "https://res.cloudinary.com/dwzmsvp7f/image/upload/f_auto,w_640/c_crop%2Cg_custom%2Fv1739089021%2Fbyzolrmkpyz1jkvpkpaj.jpg?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
              price: "0.07 ETH",
              category: "Sports",
            },
            {
              id: "s3",
              title: "Puneri Paltan vs Tamil Thalaivas",
              description: "Pro Kabaddi League, also known as PKL, is an Indian professional Kabaddi league for men.",
              date: "2025-07-30",
              time: "8:00 PM",
              location: "Shree Shiv Chhatrapati Sports Complex, Balewadi, Pune",
              image:
                "https://i.ytimg.com/vi/JU-00J4ZnhE/hq720.jpg?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
              price: "0.11 ETH",
              category: "Sports",
            },
          ],
          music: [
            {
              id: "m1",
              title: "Summer Music Festival",
              description: "A three-day music festival featuring top artists from around the world.",
              date: "2023-07-15",
              time: "12:00 PM",
              location: "Central Park, New York",
              image:
                "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
              price: "0.05 ETH",
              category: "Music",
            },
            {
              id: "m2",
              title: "Rock Legends Reunion",
              description: "Legendary rock bands reunite for one special night of classic hits.",
              date: "2023-08-05",
              time: "7:30 PM",
              location: "Barclays Center, Brooklyn",
              image:
                "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
              price: "0.12 ETH",
              category: "Music",
            },
            {
              id: "m3",
              title: "Electronic Music Showcase",
              description: "The best DJs and electronic music producers in one epic night.",
              date: "2023-07-29",
              time: "10:00 PM",
              location: "Warehouse District, Los Angeles",
              image:
                "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
              price: "0.04 ETH",
              category: "Music",
            },
          ],
        })
        setIsLoading(false)
      }, 1000)
    }

    fetchEvents()
  }, [])

  const EventCard = ({ event }: { event: Event }) => {
    return (
      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} className="h-full">
        <Card className="overflow-hidden h-full flex flex-col">
          <div className="aspect-video w-full overflow-hidden">
            <img src={event.image || "/placeholder.svg"} alt={event.title} className="object-cover w-full h-full" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <Badge>{event.category}</Badge>
            </div>
            <CardDescription className="line-clamp-2">{event.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pb-2">
            <div className="flex flex-col space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center mt-1">
                <Ticket className="mr-2 h-4 w-4 text-primary" />
                <span className="font-bold">{event.price}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href={`/events/${event.id}`} className="w-full">
              <Button className="w-full">{isConnected ? "Buy Ticket" : "View Details"}</Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    )
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
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Trending Events</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Discover the hottest upcoming events and secure your tickets with blockchain technology
            </p>
          </div>
        </motion.div>

        <div className="mt-10">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Trending</TabsTrigger>
              <TabsTrigger value="music">Music Events</TabsTrigger>
              <TabsTrigger value="sports">Sports Events</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
                    ))}
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-4">Top Sports Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {events.sports.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>

                  <h3 className="text-xl font-semibold mb-4">Top Music Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.music.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="music">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.music.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sports">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.sports.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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

