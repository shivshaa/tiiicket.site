//Filename: action.ts

import { supabase } from "@/lib/supabase"
import { 
  buyResaleTicket, 
  listTicketForSale as contractListTicket,
  delistTicketFromSale,
  getUserTickets,
  ethToInr,
  inrToEth
} from "./contract"

// Types for ticket operations
interface TicketData {
  id: string
  token_id: number
  event_id: string
  price: number
  owner_address: string
  is_valid: boolean
  for_sale: boolean
  event: {
    name: string
    description: string
    start_time: string
    end_time: string
  }
}

interface BuyTicketParams {
  ticketId: string
  tokenId: number
  eventId: string
  buyerAddress: string
  price: number // Price in INR
}

interface ListTicketParams {
  ticketId: string
  tokenId: number
  eventId: string
  sellerAddress: string
  originalPrice: number // Original price in INR
  resalePrice: number // Resale price in INR
}

interface CancelListingParams {
  ticketId: string
  tokenId: number
  eventId: string
  sellerAddress: string
}

interface TransferTicketParams {
  ticketId: string
  tokenId: number
  eventId: string
  fromAddress: string
  toAddress: string
}

type StatusCallback = (status: { status: "success" | "error" | "pending"; message: string }) => void

// Fetch ticket by ID
export const fetchTicketById = async (ticketId: string): Promise<TicketData> => {
  try {
    // First, try to get the ticket from the tickets table
    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        token_id,
        event_id,
        owner_address,
        price,
        for_sale,
        resale_price,
        purchase_date,
        category,
        seat_info,
        event_name,
        image_url,
        qr_code
      `)
      .eq("token_id", ticketId)
      .single()

    if (ticketError) {
      console.error("Error fetching ticket:", ticketError)
      throw new Error(`Ticket not found: ${ticketError.message}`)
    }

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from("event_data")
      .select(`
        id,
        name,
        description,
        date,
        time,
        location,
        event_image_url,
        category
      `)
      .eq("id", ticketData.event_id)
      .single()

    if (eventError) {
      console.error("Error fetching event:", eventError)
      throw new Error(`Event not found: ${eventError.message}`)
    }

    // Combine ticket and event data
    const ticket: TicketData = {
      id: ticketData.ticket_id || ticketId,
      token_id: ticketData.token_id,
      event_id: ticketData.event_id,
      price: ticketData.for_sale ? ticketData.resale_price || ticketData.price : ticketData.price,
      owner_address: ticketData.owner_address,
      is_valid: true, // Assume valid for now
      for_sale: ticketData.for_sale || false,
      event: {
        name: eventData.name,
        description: eventData.description,
        start_time: `${eventData.date}T${eventData.time}`,
        end_time: `${eventData.date}T${eventData.time}`, // Assuming same day event
      },
    }

    return ticket
  } catch (error) {
    console.error("Error in fetchTicketById:", error)
    throw error
  }
}

// Buy ticket function with blockchain integration
export const buyTicket = async (
  params: BuyTicketParams,
  statusCallback: StatusCallback,
): Promise<{ success: boolean; message?: string }> => {
  try {
    statusCallback({ status: "pending", message: "Validating ticket availability..." })

    // Check if ticket is available for sale
    const { data: ticketCheck, error: checkError } = await supabase
      .from("tickets")
      .select("for_sale, owner_address, price, resale_price")
      .eq("token_id", params.tokenId)
      .single()

    if (checkError || !ticketCheck) {
      throw new Error("Ticket not found")
    }

    if (!ticketCheck.for_sale) {
      throw new Error("Ticket is not for sale")
    }

    if (ticketCheck.owner_address.toLowerCase() === params.buyerAddress.toLowerCase()) {
      throw new Error("You cannot buy your own ticket")
    }

    // Convert INR price to ETH for blockchain transaction
    const priceInEth = inrToEth(params.price)
    
    statusCallback({ status: "pending", message: "Processing blockchain transaction..." })

    // Execute blockchain transaction
    const blockchainResult = await buyResaleTicket(params.tokenId, priceInEth)
    
    if (!blockchainResult.success) {
      throw new Error("Blockchain transaction failed")
    }

    statusCallback({ status: "pending", message: "Updating database records..." })

    // Update ticket ownership in database
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        owner_address: params.buyerAddress,
        for_sale: false,
        resale_price: null,
        purchase_date: new Date().toISOString(),
      })
      .eq("token_id", params.tokenId)

    if (updateError) {
      console.error("Database update failed, but blockchain transaction succeeded:", updateError)
      // Note: In production, you might want to implement a recovery mechanism here
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    // Update secondary sales record
    const { error: salesError } = await supabase
      .from("secondary_sales")
      .update({
        status: "completed",
        buyer_address: params.buyerAddress,
        sale_date: new Date().toISOString(),
        transaction_hash: blockchainResult.tx.hash,
      })
      .eq("token_id", params.tokenId)
      .eq("status", "pending")

    if (salesError && salesError.code !== "PGRST116") {
      console.warn("Warning: Could not update secondary sales record:", salesError)
    }

    statusCallback({ status: "success", message: "Ticket purchased successfully!" })
    return { 
      success: true, 
      message: "Ticket purchased successfully!",
      transactionHash: blockchainResult.tx.hash 
    }
  } catch (error: any) {
    console.error("Error buying ticket:", error)
    statusCallback({ status: "error", message: error.message || "Failed to buy ticket" })
    return { success: false, message: error.message || "Failed to buy ticket" }
  }
}

// List ticket for resale with blockchain integration
export const listTicketForResale = async (
  params: ListTicketParams,
  statusCallback: StatusCallback,
): Promise<{ success: boolean; message?: string }> => {
  try {
    statusCallback({ status: "pending", message: "Validating ticket ownership..." })

    // Verify ownership
    const { data: ticketCheck, error: checkError } = await supabase
      .from("tickets")
      .select("owner_address, for_sale")
      .eq("token_id", params.tokenId)
      .single()

    if (checkError || !ticketCheck) {
      throw new Error("Ticket not found")
    }

    if (ticketCheck.owner_address.toLowerCase() !== params.sellerAddress.toLowerCase()) {
      throw new Error("You don't own this ticket")
    }

    if (ticketCheck.for_sale) {
      throw new Error("Ticket is already listed for sale")
    }

    // Check for existing pending listing
    const { data: existingListing } = await supabase
      .from("secondary_sales")
      .select("sale_id")
      .eq("token_id", params.tokenId)
      .eq("status", "pending")
      .single()

    if (existingListing) {
      throw new Error("Ticket already has a pending listing")
    }

    // Convert INR price to ETH for blockchain transaction
    const resalePriceInEth = inrToEth(params.resalePrice)
    
    statusCallback({ status: "pending", message: "Processing blockchain transaction..." })

    // Execute blockchain transaction to list ticket for sale
    const blockchainResult = await contractListTicket(params.tokenId, resalePriceInEth)
    
    if (!blockchainResult.success) {
      throw new Error("Blockchain transaction failed")
    }

    statusCallback({ status: "pending", message: "Creating marketplace listing..." })

    // Create secondary sale record
    const { error: saleError } = await supabase.from("secondary_sales").insert({
      token_id: params.tokenId,
      event_id: params.eventId,
      seller_address: params.sellerAddress,
      original_price: params.originalPrice,
      resale_price: params.resalePrice,
      status: "pending",
      sale_date: new Date().toISOString(),
      transaction_hash: blockchainResult.tx.hash,
    })

    if (saleError) {
      console.error("Database insert failed, but blockchain transaction succeeded:", saleError)
      throw new Error(`Failed to create listing: ${saleError.message}`)
    }

    // Update ticket status
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        for_sale: true,
        resale_price: params.resalePrice,
      })
      .eq("token_id", params.tokenId)

    if (updateError) {
      console.error("Database update failed:", updateError)
      throw new Error(`Failed to update ticket: ${updateError.message}`)
    }

    statusCallback({ status: "success", message: "Ticket listed for resale successfully!" })
    return { 
      success: true, 
      message: "Ticket listed for resale successfully!",
      transactionHash: blockchainResult.tx.hash 
    }
  } catch (error: any) {
    console.error("Error listing ticket:", error)
    statusCallback({ status: "error", message: error.message || "Failed to list ticket" })
    return { success: false, message: error.message || "Failed to list ticket" }
  }
}

// Cancel ticket listing with blockchain integration
export const cancelTicketListing = async (
  params: CancelListingParams,
  statusCallback: StatusCallback,
): Promise<{ success: boolean; message?: string }> => {
  try {
    statusCallback({ status: "pending", message: "Validating listing ownership..." })

    // Verify ownership and listing status
    const { data: ticketCheck, error: checkError } = await supabase
      .from("tickets")
      .select("owner_address, for_sale")
      .eq("token_id", params.tokenId)
      .single()

    if (checkError || !ticketCheck) {
      throw new Error("Ticket not found")
    }

    if (ticketCheck.owner_address.toLowerCase() !== params.sellerAddress.toLowerCase()) {
      throw new Error("You don't own this ticket")
    }

    if (!ticketCheck.for_sale) {
      throw new Error("Ticket is not listed for sale")
    }

    statusCallback({ status: "pending", message: "Processing blockchain transaction..." })

    // Execute blockchain transaction to delist ticket
    const blockchainResult = await delistTicketFromSale(params.tokenId)
    
    if (!blockchainResult.success) {
      throw new Error("Blockchain transaction failed")
    }

    statusCallback({ status: "pending", message: "Updating database records..." })

    // Update secondary sales record
    const { error: salesError } = await supabase
      .from("secondary_sales")
      .update({
        status: "cancelled",
        sale_date: new Date().toISOString(),
        transaction_hash: blockchainResult.tx.hash,
      })
      .eq("token_id", params.tokenId)
      .eq("status", "pending")

    if (salesError) {
      console.error("Database update failed:", salesError)
      throw new Error(`Failed to cancel listing: ${salesError.message}`)
    }

    // Update ticket status
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        for_sale: false,
        resale_price: null,
      })
      .eq("token_id", params.tokenId)

    if (updateError) {
      console.error("Database update failed:", updateError)
      throw new Error(`Failed to update ticket: ${updateError.message}`)
    }

    statusCallback({ status: "success", message: "Ticket listing cancelled successfully!" })
    return { 
      success: true, 
      message: "Ticket listing cancelled successfully!",
      transactionHash: blockchainResult.tx.hash 
    }
  } catch (error: any) {
    console.error("Error cancelling listing:", error)
    statusCallback({ status: "error", message: error.message || "Failed to cancel listing" })
    return { success: false, message: error.message || "Failed to cancel listing" }
  }
}

// Transfer ticket (blockchain integration can be added later if needed)
export const transferTicket = async (
  params: TransferTicketParams,
  statusCallback: StatusCallback,
): Promise<{ success: boolean; message?: string }> => {
  try {
    statusCallback({ status: "pending", message: "Initiating ticket transfer..." })

    // Verify ownership
    const { data: ticketCheck, error: checkError } = await supabase
      .from("tickets")
      .select("owner_address, for_sale")
      .eq("token_id", params.tokenId)
      .single()

    if (checkError || !ticketCheck) {
      throw new Error("Ticket not found")
    }

    if (ticketCheck.owner_address.toLowerCase() !== params.fromAddress.toLowerCase()) {
      throw new Error("You don't own this ticket")
    }

    if (ticketCheck.for_sale) {
      throw new Error("Cannot transfer a ticket that is listed for sale")
    }

    if (params.fromAddress.toLowerCase() === params.toAddress.toLowerCase()) {
      throw new Error("Cannot transfer to the same address")
    }

    statusCallback({ status: "pending", message: "Processing blockchain transaction..." })

    // TODO: Implement blockchain transfer function when available in contract.ts
    // For now, simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update ticket ownership
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        owner_address: params.toAddress,
        purchase_date: new Date().toISOString(),
      })
      .eq("token_id", params.tokenId)

    if (updateError) {
      throw new Error(`Failed to transfer ticket: ${updateError.message}`)
    }

    statusCallback({ status: "success", message: "Ticket transferred successfully!" })
    return { success: true, message: "Ticket transferred successfully!" }
  } catch (error: any) {
    console.error("Error transferring ticket:", error)
    statusCallback({ status: "error", message: error.message || "Failed to transfer ticket" })
    return { success: false, message: error.message || "Failed to transfer ticket" }
  }
}

// Helper function to refresh user tickets after blockchain operations
export const refreshUserTickets = async (walletAddress: string) => {
  try {
    return await getUserTickets(walletAddress)
  } catch (error) {
    console.error("Error refreshing user tickets:", error)
    return []
  }
}

// Helper function to convert prices for display
export const formatPriceDisplay = (priceInINR: number) => {
  const priceInETH = inrToEth(priceInINR)
  return {
    inr: `₹${priceInINR.toLocaleString()}`,
    eth: `${priceInETH} ETH`,
    ethValue: parseFloat(priceInETH)
  }
}
