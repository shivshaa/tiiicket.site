import { supabase } from "@/lib/supabaseClient"
import { listTicketForSale, delistTicketFromSale } from "@/lib/contract"

export interface ListForResaleParams {
  ticketId: string | number
  tokenId: number
  eventId: string | number
  sellerAddress: string
  originalPrice: number
  resalePrice: number
}

export interface ListingStatus {
  status:
    | "idle"
    | "preparing"
    | "wallet-confirm"
    | "blockchain-pending"
    | "blockchain-success"
    | "database-pending"
    | "success"
    | "error"
  message: string
  error?: any
  transactionHash?: string
}

export const listTicketForResale = async (
  params: ListForResaleParams,
  onStatusChange: (status: ListingStatus) => void,
): Promise<{ success: boolean; saleId?: string; transactionHash?: string; error?: any }> => {
  try {
    // Initial status
    onStatusChange({
      status: "preparing",
      message: "Preparing to list your ticket for resale...",
    })

    // Validate inputs
    if (!params.ticketId || !params.tokenId || !params.eventId || !params.sellerAddress || !params.resalePrice) {
      const error = new Error("Missing required parameters for listing ticket")
      onStatusChange({
        status: "error",
        message: "Missing required information for ticket listing",
        error,
      })
      return { success: false, error }
    }

    // Check if ticket already has a pending listing
    const { data: existingListing, error: checkError } = await supabase
      .from("secondary_sales")
      .select("sale_id, status")
      .eq("token_id", params.tokenId)
      .eq("status", "pending")
      .maybeSingle()

    if (existingListing) {
      const error = new Error("This ticket already has a pending listing")
      onStatusChange({
        status: "error",
        message: "This ticket is already listed for sale",
        error,
      })
      return { success: false, error }
    }

    // Convert price to ETH for blockchain
    const priceInEth = (params.resalePrice / 200000).toString() // Using ETH_TO_INR_RATE

    // Wallet confirmation status
    onStatusChange({
      status: "wallet-confirm",
      message: "Please confirm the transaction in your wallet...",
    })

    // Call the contract function
    const result = await listTicketForSale(params.tokenId, priceInEth)

    // Blockchain pending status
    onStatusChange({
      status: "blockchain-pending",
      message: "Transaction submitted to blockchain. Waiting for confirmation...",
      transactionHash: result.tx.hash,
    })

    // Blockchain success status
    onStatusChange({
      status: "blockchain-success",
      message: "Blockchain transaction confirmed! Saving listing details...",
      transactionHash: result.receipt.hash,
    })

    // Database pending status
    onStatusChange({
      status: "database-pending",
      message: "Saving your listing information...",
      transactionHash: result.receipt.hash,
    })

    // Generate a unique sale ID
    const saleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Insert into secondary_sales table
    const { data: saleData, error: saleError } = await supabase
      .from("secondary_sales")
      .insert({
        sale_id: saleId,
        token_id: params.tokenId,
        event_id: params.eventId,
        seller_address: params.sellerAddress,
        original_price: params.originalPrice,
        resale_price: params.resalePrice,
        status: "pending",
        sale_date: new Date().toISOString(),
        transaction_hash: result.receipt.hash,
      })
      .select()

    if (saleError) {
      console.error("Error creating secondary sale entry:", saleError)
      onStatusChange({
        status: "error",
        message: "Ticket listed on blockchain but failed to save details. Please contact support.",
        error: saleError,
        transactionHash: result.receipt.hash,
      })
      return {
        success: true, // Still return success since blockchain transaction succeeded
        transactionHash: result.receipt.hash,
        error: saleError,
      }
    }

    // Update the ticket status
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({
        for_sale: true,
        resale_price: params.resalePrice,
        last_updated: new Date().toISOString(),
      })
      .eq("token_id", params.tokenId)

    if (ticketError) {
      console.error("Error updating ticket status:", ticketError)
      // We don't fail the operation here since the listing is already created
    }

    // Success status
    onStatusChange({
      status: "success",
      message: "Ticket listed for resale successfully!",
      transactionHash: result.receipt.hash,
    })

    return {
      success: true,
      saleId,
      transactionHash: result.receipt.hash,
    }
  } catch (error) {
    console.error("Error listing ticket for resale:", error)

    onStatusChange({
      status: "error",
      message: error.message || "Failed to list ticket for resale",
      error,
    })

    return { success: false, error }
  }
}

export const cancelTicketListing = async (
  tokenId: number,
  onStatusChange: (status: ListingStatus) => void,
): Promise<{ success: boolean; transactionHash?: string; error?: any }> => {
  try {
    // Initial status
    onStatusChange({
      status: "preparing",
      message: "Preparing to cancel your ticket listing...",
    })

    // Check if there's a pending listing for this token
    const { data: existingListing, error: checkError } = await supabase
      .from("secondary_sales")
      .select("sale_id, status")
      .eq("token_id", tokenId)
      .eq("status", "pending")
      .maybeSingle()

    if (!existingListing) {
      const error = new Error("No pending listing found for this ticket")
      onStatusChange({
        status: "error",
        message: "No active listing found for this ticket",
        error,
      })
      return { success: false, error }
    }

    // Wallet confirmation status
    onStatusChange({
      status: "wallet-confirm",
      message: "Please confirm the transaction in your wallet...",
    })

    // Call the contract function
    const result = await delistTicketFromSale(tokenId)

    // Blockchain pending status
    onStatusChange({
      status: "blockchain-pending",
      message: "Transaction submitted to blockchain. Waiting for confirmation...",
      transactionHash: result.tx.hash,
    })

    // Blockchain success status
    onStatusChange({
      status: "blockchain-success",
      message: "Blockchain transaction confirmed! Updating listing status...",
      transactionHash: result.receipt.hash,
    })

    // Database pending status
    onStatusChange({
      status: "database-pending",
      message: "Updating your listing information...",
      transactionHash: result.receipt.hash,
    })

    // Update the secondary_sales table
    const { error: saleError } = await supabase
      .from("secondary_sales")
      .update({
        status: "cancelled",
        sale_date: new Date().toISOString(),
        transaction_hash: result.receipt.hash,
      })
      .eq("token_id", tokenId)
      .eq("status", "pending")

    if (saleError) {
      console.error("Error updating secondary sale status:", saleError)
      onStatusChange({
        status: "error",
        message: "Listing cancelled on blockchain but failed to update details. Please contact support.",
        error: saleError,
        transactionHash: result.receipt.hash,
      })
      return {
        success: true, // Still return success since blockchain transaction succeeded
        transactionHash: result.receipt.hash,
        error: saleError,
      }
    }

    // Update the ticket status
    const { error: ticketError } = await supabase
      .from("tickets")
      .update({
        for_sale: false,
        resale_price: null,
        last_updated: new Date().toISOString(),
      })
      .eq("token_id", tokenId)

    if (ticketError) {
      console.error("Error updating ticket status:", ticketError)
      // We don't fail the operation here since the listing is already cancelled
    }

    // Success status
    onStatusChange({
      status: "success",
      message: "Ticket listing cancelled successfully!",
      transactionHash: result.receipt.hash,
    })

    return {
      success: true,
      transactionHash: result.receipt.hash,
    }
  } catch (error) {
    console.error("Error cancelling ticket listing:", error)

    onStatusChange({
      status: "error",
      message: error.message || "Failed to cancel ticket listing",
      error,
    })

    return { success: false, error }
  }
}
