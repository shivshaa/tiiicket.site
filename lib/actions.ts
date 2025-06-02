"use server"

import { createClient } from "@/lib/supabase"

// Status callback type
type StatusCallback = (status: { status: "success" | "error" | "pending"; message: string }) => void

// Fetch ticket by ID
export async function fetchTicketById(ticketId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      token_id,
      event_id,
      price,
      owner_address,
      is_valid,
      for_sale,
      events (
        name,
        description,
        start_time,
        end_time
      )
    `)
    .eq("id", ticketId)
    .single()

  if (error) {
    console.error("Error fetching ticket:", error)
    throw new Error("Failed to fetch ticket details")
  }

  if (!data) {
    throw new Error("Ticket not found")
  }

  return {
    ...data,
    event: data.events,
  }
}

// Buy ticket
export async function buyTicket(
  params: {
    ticketId: string
    tokenId: number
    eventId: string
    buyerAddress: string
    price: number
  },
  statusCallback?: StatusCallback,
) {
  try {
    statusCallback?.({ status: "pending", message: "Initiating purchase transaction..." })

    // Simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    statusCallback?.({ status: "pending", message: "Confirming transaction..." })

    // Simulate another delay for confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const supabase = createClient()

    // Update ticket ownership in database
    const { error } = await supabase
      .from("tickets")
      .update({
        owner_address: params.buyerAddress,
        for_sale: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.ticketId)

    if (error) {
      console.error("Database error:", error)
      statusCallback?.({ status: "error", message: "Database update failed" })
      throw new Error("Failed to update ticket ownership")
    }

    // Record the purchase transaction
    const { error: txError } = await supabase.from("transactions").insert({
      ticket_id: params.ticketId,
      event_id: params.eventId,
      buyer_address: params.buyerAddress,
      price: params.price,
      transaction_type: "purchase",
    })

    if (txError) {
      console.error("Transaction record error:", txError)
      // Non-critical error, don't throw
    }

    statusCallback?.({ status: "success", message: "Purchase successful! Ticket is now yours." })

    return { success: true }
  } catch (error: any) {
    console.error("Buy ticket error:", error)
    statusCallback?.({ status: "error", message: error.message || "Purchase failed" })
    throw error
  }
}

// Cancel ticket listing
export async function cancelTicketListing(
  params: {
    ticketId: string
    tokenId: number
    eventId: string
    sellerAddress: string
  },
  statusCallback?: StatusCallback,
) {
  try {
    statusCallback?.({ status: "pending", message: "Initiating cancellation..." })

    // Simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const supabase = createClient()

    // Update ticket in database
    const { error } = await supabase
      .from("tickets")
      .update({
        for_sale: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.ticketId)
      .eq("owner_address", params.sellerAddress)

    if (error) {
      console.error("Database error:", error)
      statusCallback?.({ status: "error", message: "Database update failed" })
      throw new Error("Failed to cancel listing")
    }

    statusCallback?.({ status: "success", message: "Listing cancelled successfully" })

    return { success: true }
  } catch (error: any) {
    console.error("Cancel listing error:", error)
    statusCallback?.({ status: "error", message: error.message || "Cancellation failed" })
    throw error
  }
}

// List ticket for resale
export async function listTicketForResale(
  params: {
    ticketId: string
    tokenId: number
    eventId: string
    sellerAddress: string
    originalPrice: number
    resalePrice: number
  },
  statusCallback?: StatusCallback,
) {
  try {
    statusCallback?.({ status: "pending", message: "Preparing listing..." })

    // Simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    statusCallback?.({ status: "pending", message: "Confirming transaction..." })

    const supabase = createClient()

    // Update ticket in database
    const { error } = await supabase
      .from("tickets")
      .update({
        for_sale: true,
        price: params.resalePrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.ticketId)
      .eq("owner_address", params.sellerAddress)

    if (error) {
      console.error("Database error:", error)
      statusCallback?.({ status: "error", message: "Database update failed" })
      throw new Error("Failed to list ticket for resale")
    }

    // Record the listing
    const { error: listingError } = await supabase.from("resale_listings").insert({
      ticket_id: params.ticketId,
      event_id: params.eventId,
      seller_address: params.sellerAddress,
      original_price: params.originalPrice,
      asking_price: params.resalePrice,
    })

    if (listingError) {
      console.error("Listing record error:", listingError)
      // Non-critical error, don't throw
    }

    statusCallback?.({ status: "success", message: "Ticket listed for resale successfully" })

    return { success: true }
  } catch (error: any) {
    console.error("List for resale error:", error)
    statusCallback?.({ status: "error", message: error.message || "Listing failed" })
    throw error
  }
}

// Transfer ticket
export async function transferTicket(
  params: {
    ticketId: string
    tokenId: number
    eventId: string
    fromAddress: string
    toAddress: string
  },
  statusCallback?: StatusCallback,
) {
  try {
    statusCallback?.({ status: "pending", message: "Initiating transfer..." })

    // Simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    statusCallback?.({ status: "pending", message: "Confirming transfer..." })

    const supabase = createClient()

    // Update ticket ownership in database
    const { error } = await supabase
      .from("tickets")
      .update({
        owner_address: params.toAddress,
        for_sale: false, // Reset for_sale status when transferred
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.ticketId)
      .eq("owner_address", params.fromAddress)

    if (error) {
      console.error("Database error:", error)
      statusCallback?.({ status: "error", message: "Database update failed" })
      throw new Error("Failed to transfer ticket")
    }

    // Record the transfer transaction
    const { error: txError } = await supabase.from("transactions").insert({
      ticket_id: params.ticketId,
      event_id: params.eventId,
      seller_address: params.fromAddress,
      buyer_address: params.toAddress,
      price: 0, // No price for direct transfers
      transaction_type: "transfer",
    })

    if (txError) {
      console.error("Transaction record error:", txError)
      // Non-critical error, don't throw
    }

    statusCallback?.({ status: "success", message: "Ticket transferred successfully" })

    return { success: true }
  } catch (error: any) {
    console.error("Transfer ticket error:", error)
    statusCallback?.({ status: "error", message: error.message || "Transfer failed" })
    throw error
  }
}
