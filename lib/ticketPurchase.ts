import { mintTicket } from "@/lib/contract"
import { supabase } from "@/lib/supabaseClient"

export interface TicketPurchaseParams {
  eventId: number
  ticketURI: string
  seatInfo: string
  ticketCategory: string
  price: string
  eventName: string
  eventImageUrl: string
  buyerAddress: string
}

export interface TicketPurchaseStatus {
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
  tokenId?: number
}

export const purchaseTicket = async (
  params: TicketPurchaseParams,
  onStatusChange: (status: TicketPurchaseStatus) => void,
): Promise<{ success: boolean; tokenId?: number; transactionHash?: string; error?: any }> => {
  try {
    // Initial status
    onStatusChange({
      status: "preparing",
      message: "Preparing your ticket purchase...",
    })

    // Validate inputs
    if (
      !params.eventId ||
      !params.ticketURI ||
      !params.seatInfo ||
      !params.ticketCategory ||
      !params.price ||
      !params.buyerAddress
    ) {
      const error = new Error("Missing required parameters for purchasing ticket")
      onStatusChange({
        status: "error",
        message: "Missing required information for ticket purchase",
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
    const result = await mintTicket(
      params.eventId,
      params.ticketURI,
      params.seatInfo,
      params.ticketCategory,
      params.price,
    )

    // Blockchain pending status
    onStatusChange({
      status: "blockchain-pending",
      message: "Transaction submitted to blockchain. Waiting for confirmation...",
      transactionHash: result.tx.hash,
    })

    // Wait for transaction confirmation
    const receipt = await result.tx.wait()

    // Extract token ID
    const tokenId = result.tokenId

    if (!tokenId) {
      const error = new Error("Failed to extract token ID from transaction")
      onStatusChange({
        status: "error",
        message: "Transaction succeeded but failed to get ticket ID",
        error,
        transactionHash: receipt.hash,
      })
      return { success: false, transactionHash: receipt.hash, error }
    }

    // Blockchain success status
    onStatusChange({
      status: "blockchain-success",
      message: "Blockchain transaction confirmed! Saving ticket details...",
      transactionHash: receipt.hash,
      tokenId,
    })

    // Database pending status
    onStatusChange({
      status: "database-pending",
      message: "Saving your ticket information...",
      transactionHash: receipt.hash,
      tokenId,
    })

    // Save ticket to database
    const ticketData = {
      ticket_id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event_id: params.eventId,
      owner_address: params.buyerAddress.toLowerCase(),
      price: Number.parseFloat(params.price),
      category: params.ticketCategory,
      token_uri: params.ticketURI,
      token_id: tokenId,
      purchase_date: new Date().toISOString(),
      seat_info: params.seatInfo,
      event_name: params.eventName,
      image_url: params.eventImageUrl,
      for_sale: false,
      transaction_hash: receipt.hash,
    }

    const { error: dbError } = await supabase.from("tickets").insert([ticketData])

    if (dbError) {
      console.error("Error saving ticket to database:", dbError)
      onStatusChange({
        status: "error",
        message: "Ticket purchased on blockchain but failed to save details. Please contact support.",
        error: dbError,
        transactionHash: receipt.hash,
        tokenId,
      })
      return {
        success: true, // Still return success since blockchain transaction succeeded
        tokenId,
        transactionHash: receipt.hash,
        error: dbError,
      }
    }

    // Success status
    onStatusChange({
      status: "success",
      message: "Ticket purchased successfully!",
      transactionHash: receipt.hash,
      tokenId,
    })

    return {
      success: true,
      tokenId,
      transactionHash: receipt.hash,
    }
  } catch (error) {
    console.error("Error purchasing ticket:", error)

    onStatusChange({
      status: "error",
      message: error.message || "Failed to purchase ticket",
      error,
    })

    return { success: false, error }
  }
}
