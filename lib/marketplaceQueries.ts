import { supabase } from "@/lib/supabaseClient"

// Cache for event tickets
const eventTicketsCache = new Map()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

export const getTicketsListedForEventOptimized = async (eventId: string | number) => {
  const cacheKey = `event-tickets-${eventId}`

  // Check cache first
  if (eventTicketsCache.has(cacheKey)) {
    const { data, expiry } = eventTicketsCache.get(cacheKey)
    if (Date.now() < expiry) {
      return data
    }
    // Cache expired, remove it
    eventTicketsCache.delete(cacheKey)
  }

  try {
    // Check if the event exists first
    const { data: eventData, error: eventError } = await supabase
      .from("event_data")
      .select("id")
      .eq("id", eventId)
      .maybeSingle()

    if (eventError || !eventData) {
      console.error("Event not found:", eventError?.message || "No event with this ID")
      return [] // Return empty array immediately if event doesn't exist
    }

    // Optimized query with proper indexing
    const { data, error } = await supabase
      .from("secondary_sales")
      .select(`
        sale_id,
        token_id,
        event_id,
        seller_address,
        original_price,
        resale_price,
        status,
        sale_date,
        tickets:token_id (
          ticket_id,
          category,
          seat_info,
          owner_address,
          image_url
        )
      `)
      .eq("event_id", eventId)
      .eq("status", "pending")
      .order("resale_price", { ascending: true })

    if (error) {
      console.error("Error fetching tickets listed for event:", error)
      return [] // Return empty array on error
    }

    // Validate the data before returning
    const validTickets = data.filter((ticket) => ticket && ticket.token_id && ticket.sale_id && ticket.seller_address)

    // Store in cache
    eventTicketsCache.set(cacheKey, {
      data: validTickets,
      expiry: Date.now() + CACHE_EXPIRY,
    })

    return validTickets || []
  } catch (error) {
    console.error("Error getting tickets listed for event:", error)
    return [] // Return empty array on any exception
  }
}

// Cache for single ticket details
const ticketDetailsCache = new Map()

export const getTicketDetailsOptimized = async (tokenId: number) => {
  const cacheKey = `ticket-${tokenId}`

  // Check cache first
  if (ticketDetailsCache.has(cacheKey)) {
    const { data, expiry } = ticketDetailsCache.get(cacheKey)
    if (Date.now() < expiry) {
      return data
    }
    // Cache expired, remove it
    ticketDetailsCache.delete(cacheKey)
  }

  try {
    // First check if the ticket exists
    const { data: ticketExists, error: checkError } = await supabase
      .from("tickets")
      .select("token_id")
      .eq("token_id", tokenId)
      .maybeSingle()

    if (checkError || !ticketExists) {
      console.error("Ticket not found:", checkError?.message || "No ticket with this ID")
      return null // Return null immediately if ticket doesn't exist
    }

    // Get ticket details with joined event data
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        event_id,
        owner_address,
        price,
        category,
        token_uri,
        token_id,
        purchase_date,
        seat_info,
        event_name,
        image_url,
        qr_code,
        for_sale,
        resale_price,
        event_data:event_id (
          name,
          description,
          date,
          time,
          location,
          event_image_url,
          category,
          organizer_id
        )
      `)
      .eq("token_id", tokenId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching ticket details:", error)
      return null
    }

    // Store in cache
    ticketDetailsCache.set(cacheKey, {
      data,
      expiry: Date.now() + CACHE_EXPIRY,
    })

    return data
  } catch (error) {
    console.error("Error fetching ticket details:", error)
    return null
  }
}

// Function to invalidate caches when data changes
export const invalidateTicketCaches = (eventId?: string | number, tokenId?: number) => {
  if (eventId) {
    eventTicketsCache.delete(`event-tickets-${eventId}`)
  }

  if (tokenId) {
    ticketDetailsCache.delete(`ticket-${tokenId}`)
  }

  // If both are undefined, clear all caches
  if (!eventId && !tokenId) {
    eventTicketsCache.clear()
    ticketDetailsCache.clear()
  }
}

// Function to get all events with tickets for sale
export const getEventsWithTicketsForSale = async () => {
  try {
    // Get all events that have tickets listed for sale
    const { data, error } = await supabase
      .from("secondary_sales")
      .select(`
        event_id,
        event_data:event_id (
          id,
          name,
          description,
          date,
          time,
          location,
          event_image_url,
          category,
          organizer_id,
          ticket_price,
          max_tickets,
          status
        )
      `)
      .eq("status", "pending")
      .order("sale_date", { ascending: false })

    if (error) {
      console.error("Error fetching events with tickets for sale:", error)
      return []
    }

    // Extract unique events
    const eventsMap = new Map()
    data.forEach((item) => {
      if (item.event_data && !eventsMap.has(item.event_data.id)) {
        eventsMap.set(item.event_data.id, item.event_data)
      }
    })

    return Array.from(eventsMap.values()).filter((event) => event.status === "active")
  } catch (error) {
    console.error("Error getting events with tickets for sale:", error)
    return []
  }
}
