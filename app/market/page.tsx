"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/components/wallet-provider"
import { getAllEvents } from "@/lib/supabase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MarketplaceEventCard } from "@/components/marketplace-event-card"
import { useToast } from "@/components/ui/use-toast"

export default function MarketplacePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [categories, setCategories] = useState(["all"])
  const router = useRouter()
  const { address } = useWallet()
  const { toast } = useToast()
  const isMounted = useRef(true)
  const fetchedRef = useRef(false)

  // Memoize the fetch events function to prevent unnecessary re-renders
  const fetchEvents = useCallback(async () => {
    if (fetchedRef.current) return

    try {
      setLoading(true)
      const allEvents = await getAllEvents()

      if (!isMounted.current) return

      // Only show active events in the marketplace
      const activeEvents = allEvents.filter((event) => event.status === "active")

      // Extract unique categories
      const uniqueCategories = [
        "all",
        ...new Set(activeEvents.map((event) => event.category?.toLowerCase() || "other")),
      ]

      setEvents(activeEvents)
      setCategories(uniqueCategories)
      fetchedRef.current = true
    } catch (error) {
      console.error("Error fetching events:", error)
      if (isMounted.current) {
        toast({
          title: "Error loading events",
          description: "Failed to load marketplace events. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    isMounted.current = true
    fetchEvents()

    return () => {
      isMounted.current = false
    }
  }, [fetchEvents])

  // Memoize the filtered events to prevent unnecessary re-renders
  const filteredEvents = useCallback(() => {
    return activeCategory === "all"
      ? events
      : events.filter((event) => (event.category?.toLowerCase() || "other") === activeCategory)
  }, [events, activeCategory])

  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Marketplace</h1>
          <p className="text-muted-foreground mt-1">Browse and purchase tickets for upcoming events</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="mb-4 flex flex-wrap">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              onClick={() => handleCategoryChange(category)}
              className="capitalize"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents().length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents().map((event) => (
            <MarketplaceEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">There are no active events in this category at the moment.</p>
        </div>
      )}
    </div>
  )
}
