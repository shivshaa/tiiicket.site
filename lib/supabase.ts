import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Create a single Supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

// Use a singleton pattern to ensure only one instance is created
let supabaseInstance: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }
  return supabaseInstance
}

export const supabase = getSupabase()

// Re-export createClient for other modules that might need it
export { createClient } from "@supabase/supabase-js"

// Function to update event status
export const updateEventStatus = async (eventId: string, status: "active" | "expired" | "canceled") => {
  try {
    const { data, error } = await supabase.from("event_data").update({ status: status }).eq("id", eventId).select()

    if (error) {
      console.error("Error updating event status:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating event status:", error)
    throw error
  }
}

// Function to add an event
export const addEvent = async (eventData: any) => {
  try {
    const { data, error } = await supabase
      .from("event_data") // Ensure table name is correct
      .insert([eventData]) // Wrap in an array as Supabase expects batch insert

    if (error) {
      console.error("Supabase error in addEvent:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in addEvent:", error)
    throw error
  }
}

// Function to get all events
export const getAllEvents = async () => {
  try {
    const { data, error } = await supabase.from("event_data").select("*").order("createdat", { ascending: false })

    if (error) {
      console.error("Error in getAllEvents:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error getting events from Supabase:", error)
    return []
  }
}

// Function to get events by category
export const getEventsByCategory = async (category: string) => {
  try {
    const { data, error } = await supabase
      .from("event_data")
      .select("*")
      .eq("category", category)
      .order("date", { ascending: true })

    if (error) {
      console.error(`Error fetching ${category} events:`, error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error(`Error getting ${category} events from Supabase:`, error)
    return []
  }
}

// Function to get an event by ID
export const getEventById = async (id: string) => {
  try {
    const { data, error } = await supabase.from("event_data").select("*").eq("id", id).single()

    if (error) {
      console.error("Error in getEventById:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting event from Supabase:", error)
    return null
  }
}

// Function to get user tickets
export const getUserTickets = async (userAddress: string) => {
  try {
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
      event_data (
        name,
        date,
        time,
        location,
        event_image_url,
        category
      )
    `)
      .eq("owner_address", userAddress)

    if (error) {
      console.error("Error in getUserTickets:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting user tickets from Supabase:", error)
    return []
  }
}

// Function to get ticket details by ticket ID
export const fetchTicketDetails = async (ticketId: string) => {
  try {
    // First check if the ticket exists
    const { data: ticketExists, error: checkError } = await supabase
      .from("tickets")
      .select("token_id")
      .eq("token_id", ticketId)
      .single()

    if (checkError || !ticketExists) {
      console.error("Ticket not found:", checkError?.message || "No ticket with this ID")
      return null // Return null immediately if ticket doesn't exist
    }

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
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
          date,
          time,
          location,
          event_image_url,
          category,
          organizer_id
        )
      `,
      )
      .eq("token_id", ticketId)
      .single()

    if (error) {
      console.error("Error in fetchTicketDetails:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching ticket details from Supabase:", error)
    return null
  }
}

// Function to get trending events
export const getTrendingEvents = async (limit: number) => {
  try {
    const { data, error } = await supabase
      .from("event_data")
      .select("*")
      .order("createdat", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching trending events:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error getting trending events from Supabase:", error)
    return []
  }
}

// Function to get events by organizer
export const getEventsByOrganizer = async (organizerId: string) => {
  try {
    const { data, error } = await supabase
      .from("event_data")
      .select("*")
      .eq("organizer_id", organizerId)
      .order("createdat", { ascending: false })

    if (error) {
      console.error("Error fetching events by organizer:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting events by organizer from Supabase:", error)
    return []
  }
}

// Function to check if a wallet address is a registered organizer
export const getOrganizerByWalletAddress = async (walletAddress: string) => {
  try {
    const { data, error } = await supabase.from("organizer").select("*").eq("organizer_id", walletAddress).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null
      }
      console.error("Error checking organizer status:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error checking organizer status:", error)
    return null
  }
}

// Function to register a new organizer
export const registerOrganizer = async (organizerData: {
  organizer_id: string
  name: string
  email: string
}) => {
  try {
    const { data, error } = await supabase
      .from("organizer")
      .insert([
        {
          ...organizerData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Error registering organizer:", error)
      throw error
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error registering organizer:", error)
    throw error
  }
}

// Function to get secondary ticket sales for an organizer
export const getSecondaryTicketSales = async (organizerId: string) => {
  try {
    // This is a simplified query - in a real app, you'd need to join with events
    // to filter by organizer_id
    const { data, error } = await supabase
      .from("secondary_sales")
      .select(`
        sale_id,
        event_id,
        event_name,
        token_id,
        original_price,
        resale_price,
        sale_date
      `)
      .order("sale_date", { ascending: false })

    if (error) {
      console.error("Error fetching secondary sales:", error)
      return []
    }

    // In a real app, you'd filter by organizer in the query
    // For now, we'll return mock data
    return (
      data || [
        {
          id: "1",
          event_id: "event1",
          event_name: "Summer Music Festival",
          ticket_id: "ticket1",
          original_price: 50,
          resale_price: 75,
          sale_date: new Date().toISOString(),
        },
        {
          id: "2",
          event_id: "event1",
          event_name: "Summer Music Festival",
          ticket_id: "ticket2",
          original_price: 50,
          resale_price: 85,
          sale_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: "3",
          event_id: "event2",
          event_name: "Tech Conference 2023",
          ticket_id: "ticket3",
          original_price: 100,
          resale_price: 120,
          sale_date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        },
      ]
    )
  } catch (error) {
    console.error("Error fetching secondary sales:", error)
    return []
  }
}

// Function to list a ticket for resale
export const listTicketForResale = async (
  ticketId: string | number,
  tokenId: number,
  eventId: string | number,
  sellerAddress: string,
  originalPrice: number,
  resalePrice: number,
) => {
  try {
    // First check if there's already a pending listing for this token
    const { data: existingListing, error: checkError } = await supabase
      .from("secondary_sales")
      .select("sale_id, status")
      .eq("token_id", tokenId)
      .eq("status", "pending")
      .single()

    if (existingListing) {
      console.log("Ticket already has a pending listing:", existingListing)
      throw new Error("This ticket already has a pending listing")
    }

    // Start a transaction
    const { data: saleData, error: saleError } = await supabase
      .from("secondary_sales")
      .insert({
        token_id: tokenId,
        event_id: eventId,
        seller_address: sellerAddress,
        original_price: originalPrice,
        resale_price: resalePrice,
        status: "pending",
        sale_date: new Date().toISOString(),
      })
      .select()

    if (saleError) {
      console.error("Error creating secondary sale entry:", saleError)
      throw saleError
    }

    // Update the ticket status
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({ for_sale: true, resale_price: resalePrice })
      .eq("token_id", tokenId)

    if (ticketError) {
      console.error("Error updating ticket status:", ticketError)
      throw ticketError
    }

    return saleData
  } catch (error) {
    console.error("Error listing ticket for resale:", error)
    throw error
  }
}

// Function to cancel a ticket listing
export const cancelTicketListing = async (tokenId: number) => {
  try {
    // First check if there's a pending listing for this token
    const { data: existingListing, error: checkError } = await supabase
      .from("secondary_sales")
      .select("sale_id, status")
      .eq("token_id", tokenId)
      .eq("status", "pending")
      .single()

    if (!existingListing) {
      console.log("No pending listing found for this ticket")
      throw new Error("No pending listing found for this ticket")
    }

    // Update the secondary_sales table
    const { error: saleError } = await supabase
      .from("secondary_sales")
      .update({
        status: "cancelled",
        sale_date: new Date().toISOString(),
      })
      .eq("token_id", tokenId)
      .eq("status", "pending")

    if (saleError) {
      console.error("Error updating secondary sale status:", saleError)
      throw saleError
    }

    // Update the ticket status
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({ for_sale: false, resale_price: null })
      .eq("token_id", tokenId)

    if (ticketError) {
      console.error("Error updating ticket status:", ticketError)
      throw ticketError
    }

    return true
  } catch (error) {
    console.error("Error cancelling ticket listing:", error)
    throw error
  }
}

// Function to get tickets listed for resale for a specific event
export const getTicketsListedForEvent = async (eventId: string | number) => {
  try {
    // Check if the event exists first
    const { data: eventData, error: eventError } = await supabase
      .from("event_data")
      .select("id")
      .eq("id", eventId)
      .single()

    if (eventError || !eventData) {
      console.error("Event not found:", eventError?.message || "No event with this ID")
      return [] // Return empty array immediately if event doesn't exist
    }

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

    return validTickets || []
  } catch (error) {
    console.error("Error getting tickets listed for event:", error)
    return [] // Return empty array on any exception
  }
}

// Function to complete a secondary sale
export const completeSecondarySale = async (saleId: string, tokenId: number, buyerAddress: string) => {
  try {
    // Update the secondary_sales table
    const { error: saleError } = await supabase
      .from("secondary_sales")
      .update({
        status: "completed",
        buyer_address: buyerAddress,
        sale_date: new Date().toISOString(),
      })
      .eq("sale_id", saleId)

    if (saleError) {
      console.error("Error updating secondary sale status:", saleError)
      throw saleError
    }

    // Update the ticket ownership
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({
        owner_address: buyerAddress,
        for_sale: false,
        resale_price: null,
      })
      .eq("token_id", tokenId)

    if (ticketError) {
      console.error("Error updating ticket ownership:", ticketError)
      throw ticketError
    }

    return true
  } catch (error) {
    console.error("Error completing secondary sale:", error)
    throw error
  }
}

// Function to get secondary sale status
export const getSecondarySaleStatus = async (tokenId: number) => {
  try {
    const { data, error } = await supabase
      .from("secondary_sales")
      .select("*")
      .eq("token_id", tokenId)
      .order("sale_date", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null
      }
      console.error("Error fetching secondary sale status:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error getting secondary sale status:", error)
    return null
  }
}

// Function to buy a ticket from the secondary market
export const buyTicketFromSecondaryMarket = async (saleId: string, tokenId: number, buyerAddress: string) => {
  try {
    // Start a transaction
    // First update the secondary_sales table
    const { error: saleError } = await supabase
      .from("secondary_sales")
      .update({
        status: "completed",
        buyer_address: buyerAddress,
        sale_date: new Date().toISOString(),
      })
      .eq("sale_id", saleId)
      .eq("status", "pending")

    if (saleError) {
      console.error("Error updating secondary sale status:", saleError)
      throw saleError
    }

    // Then update the ticket ownership
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({
        owner_address: buyerAddress,
        for_sale: false,
        resale_price: null,
      })
      .eq("token_id", tokenId)

    if (ticketError) {
      console.error("Error updating ticket ownership:", ticketError)
      throw ticketError
    }

    return true
  } catch (error) {
    console.error("Error buying ticket from secondary market:", error)
    throw error
  }
}

// Authentication functions for wallet-based sign-in

// Generate authentication nonce
export const generateAuthNonce = async (walletAddress: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc("generate_auth_nonce", {
      p_wallet_address: walletAddress.toLowerCase(),
    })

    if (error) {
      console.error("Error generating nonce:", error)
      throw new Error("Failed to generate authentication nonce")
    }

    return data
  } catch (error) {
    console.error("Nonce generation error:", error)
    throw error
  }
}

// Verify wallet signature
export const verifyWalletSignature = async (
  walletAddress: string,
  signature: string,
  nonce: string,
): Promise<{ success: boolean; token?: string; user?: any; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc("verify_wallet_signature", {
      p_wallet_address: walletAddress.toLowerCase(),
      p_signature: signature,
      p_nonce: nonce,
    })

    if (error) {
      console.error("Signature verification error:", error)
      return {
        success: false,
        error: "Signature verification failed",
      }
    }

    return data
  } catch (error) {
    console.error("Verification error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Clean up expired nonces (utility function)
export const cleanupExpiredNonces = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc("cleanup_expired_nonces")

    if (error) {
      console.error("Error cleaning up nonces:", error)
      throw error
    }

    return data || 0
  } catch (error) {
    console.error("Cleanup error:", error)
    return 0
  }
}

// Check authentication status
export const checkAuthStatus = async (token: string): Promise<boolean> => {
  try {
    // In a production environment, you would verify the JWT token here
    // For now, we'll just check if the token exists and is properly formatted
    return token && token.length === 64 && /^[a-fA-F0-9]+$/.test(token)
  } catch (error) {
    console.error("Auth status check error:", error)
    return false
  }
}
