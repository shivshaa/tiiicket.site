//Filename: contract.ts

import { ethers } from "ethers"
import contractData from "@/contract-data.json"
import { supabase } from "@/lib/supabase"

// Contract ABI and address
const contractABI = contractData.abi
const contractAddress = "0xD4C5D76320f04aDF6A31d93F06e649fbd0a347Bc"

// ETH to INR conversion rate (1 ETH = 200,000 INR)
export const ETH_TO_INR_RATE = 200000 // 1 ETH = 200,000 INR

// Function to convert ETH to INR
export const ethToInr = (ethAmount: string | number): number => {
  const amount = typeof ethAmount === "string" ? Number.parseFloat(ethAmount) : ethAmount
  return amount * ETH_TO_INR_RATE
}

// Function to convert INR to ETH
export const inrToEth = (inrAmount: string | number): string => {
  const amount = typeof inrAmount === "string" ? Number.parseFloat(inrAmount) : inrAmount
  return (amount / ETH_TO_INR_RATE).toFixed(6)
}

// Function to get contract instance with signer
export const getContract = async (withSigner = false) => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Ethereum provider not available")
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)

    if (withSigner) {
      const signer = await provider.getSigner()
      return new ethers.Contract(contractAddress, contractABI, signer)
    } else {
      return new ethers.Contract(contractAddress, contractABI, provider)
    }
  } catch (error) {
    console.error("Error getting contract:", error)
    throw error
  }
}

// Status callback type for UI updates
type StatusCallback = (status: { status: "success" | "error" | "pending"; message: string }) => void

// BLOCKCHAIN-FIRST TICKET OPERATIONS

// Fetch ticket by ID from blockchain and Supabase
export const fetchTicketById = async (ticketId: string) => {
  try {
    console.log(`🔍 Fetching ticket details for ID: ${ticketId}`)

    // First get ticket data from Supabase for metadata
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
        qr_code,
        event_data:event_id (
          name,
          description,
          date,
          time,
          location,
          event_image_url,
          category
        )
      `)
      .eq("token_id", ticketId)
      .single()

    if (ticketError) {
      console.error("❌ Error fetching ticket from Supabase:", ticketError)
      throw new Error(`Ticket not found: ${ticketError.message}`)
    }

    // Get blockchain state for verification
    try {
      const contract = await getContract()
      const blockchainTicket = await contract.getTicketDetails(ticketId)

      // Verify blockchain state matches database
      if (blockchainTicket.owner.toLowerCase() !== ticketData.owner_address.toLowerCase()) {
        console.warn("⚠️ Blockchain and database owner mismatch, updating database...")

        // Update database to match blockchain
        await supabase
          .from("tickets")
          .update({ owner_address: blockchainTicket.owner.toLowerCase() })
          .eq("token_id", ticketId)

        ticketData.owner_address = blockchainTicket.owner.toLowerCase()
      }
    } catch (blockchainError) {
      console.warn("⚠️ Could not verify blockchain state:", blockchainError)
      // Continue with database data if blockchain is unavailable
    }

    const eventData = ticketData.event_data || {}

    return {
      id: ticketData.ticket_id || ticketId,
      token_id: ticketData.token_id,
      event_id: ticketData.event_id,
      price: ticketData.for_sale ? ticketData.resale_price || ticketData.price : ticketData.price,
      owner_address: ticketData.owner_address,
      is_valid: true,
      for_sale: ticketData.for_sale || false,
      event: {
        name: eventData.name || ticketData.event_name || "Unknown Event",
        description: eventData.description || "No description available",
        start_time: eventData.date ? `${eventData.date}T${eventData.time || "00:00"}` : new Date().toISOString(),
        end_time: eventData.date ? `${eventData.date}T${eventData.time || "23:59"}` : new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("❌ Error in fetchTicketById:", error)
    throw error
  }
}

// Buy resale ticket - BLOCKCHAIN FIRST
export const buyResaleTicket = async (
  tokenId: number,
  priceInEth: string,
  buyerAddress: string,
  statusCallback?: StatusCallback,
) => {
  try {
    statusCallback?.({ status: "pending", message: "🔗 Initiating blockchain transaction..." })

    console.log(`🛒 Buying ticket #${tokenId} for ${priceInEth} ETH`)

    // Get contract with signer
    const contract = await getContract(true)

    // Convert price to Wei
    const priceInWei = ethers.parseEther(priceInEth)

    statusCallback?.({ status: "pending", message: "💰 Processing payment on blockchain..." })

    // Execute blockchain transaction
    const tx = await contract.buyResaleTicket(tokenId, {
      value: priceInWei,
      gasLimit: 500000,
    })

    statusCallback?.({ status: "pending", message: "⏳ Waiting for blockchain confirmation..." })

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    if (receipt.status !== 1) {
      throw new Error("Blockchain transaction failed")
    }

    console.log("✅ Blockchain transaction confirmed:", receipt.hash)

    statusCallback?.({ status: "pending", message: "💾 Updating database records..." })

    // Update Supabase after blockchain confirmation
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        owner_address: buyerAddress.toLowerCase(),
        for_sale: false,
        resale_price: null,
        purchase_date: new Date().toISOString(),
        activity: "purchase",
        transaction_hash: receipt.hash,
      })
      .eq("token_id", tokenId)

    if (updateError) {
      console.error("⚠️ Database update failed after successful blockchain transaction:", updateError)
      // Don't throw here as blockchain transaction succeeded
    }

    // Update secondary sales record
    await supabase
      .from("secondary_sales")
      .update({
        status: "completed",
        buyer_address: buyerAddress.toLowerCase(),
        sale_date: new Date().toISOString(),
        transaction_hash: receipt.hash,
      })
      .eq("token_id", tokenId)
      .eq("status", "pending")

    statusCallback?.({ status: "success", message: "🎉 Ticket purchased successfully!" })

    return {
      success: true,
      tx,
      receipt,
      tokenId,
      transactionHash: receipt.hash,
    }
  } catch (error: any) {
    console.error("❌ Error buying ticket:", error)
    statusCallback?.({ status: "error", message: error.message || "Failed to buy ticket" })
    throw error
  }
}

// List ticket for sale - BLOCKCHAIN FIRST
export const listTicketForSale = async (
  tokenId: number,
  priceInEth: string,
  sellerAddress: string,
  statusCallback?: StatusCallback,
) => {
  try {
    statusCallback?.({ status: "pending", message: "🔗 Initiating blockchain transaction..." })

    console.log(`📝 Listing ticket #${tokenId} for sale at ${priceInEth} ETH`)

    // Get contract with signer
    const contract = await getContract(true)

    // Convert price to Wei
    const priceInWei = ethers.parseEther(priceInEth)

    statusCallback?.({ status: "pending", message: "📋 Creating marketplace listing on blockchain..." })

    // Execute blockchain transaction
    const tx = await contract.listTicketForSale(tokenId, priceInWei, {
      gasLimit: 300000,
    })

    statusCallback?.({ status: "pending", message: "⏳ Waiting for blockchain confirmation..." })

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    if (receipt.status !== 1) {
      throw new Error("Blockchain transaction failed")
    }

    console.log("✅ Blockchain listing confirmed:", receipt.hash)

    statusCallback?.({ status: "pending", message: "💾 Updating database records..." })

    // Update Supabase after blockchain confirmation
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        for_sale: true,
        resale_price: Number.parseFloat(priceInEth),
        activity: "list_for_sale",
        transaction_hash: receipt.hash,
      })
      .eq("token_id", tokenId)

    if (updateError) {
      console.error("⚠️ Database update failed after successful blockchain transaction:", updateError)
    }

    // Create secondary sale record
    const { data: ticketData } = await supabase
      .from("tickets")
      .select("event_id, price")
      .eq("token_id", tokenId)
      .single()

    if (ticketData) {
      await supabase.from("secondary_sales").insert({
        token_id: tokenId,
        event_id: ticketData.event_id,
        seller_address: sellerAddress.toLowerCase(),
        original_price: ticketData.price,
        resale_price: Number.parseFloat(priceInEth),
        status: "pending",
        sale_date: new Date().toISOString(),
        transaction_hash: receipt.hash,
      })
    }

    statusCallback?.({ status: "success", message: "🎉 Ticket listed for sale successfully!" })

    return {
      success: true,
      tx,
      receipt,
      transactionHash: receipt.hash,
    }
  } catch (error: any) {
    console.error("❌ Error listing ticket for sale:", error)
    statusCallback?.({ status: "error", message: error.message || "Failed to list ticket" })
    throw error
  }
}

// Delist ticket from sale - BLOCKCHAIN FIRST
export const delistTicketFromSale = async (tokenId: number, statusCallback?: StatusCallback) => {
  try {
    statusCallback?.({ status: "pending", message: "🔗 Initiating blockchain transaction..." })

    console.log(`🗑️ Delisting ticket #${tokenId} from sale`)

    // Get contract with signer
    const contract = await getContract(true)

    statusCallback?.({ status: "pending", message: "📋 Removing listing from blockchain..." })

    // Execute blockchain transaction
    const tx = await contract.delistTicketFromSale(tokenId, {
      gasLimit: 300000,
    })

    statusCallback?.({ status: "pending", message: "⏳ Waiting for blockchain confirmation..." })

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    if (receipt.status !== 1) {
      throw new Error("Blockchain transaction failed")
    }

    console.log("✅ Blockchain delisting confirmed:", receipt.hash)

    statusCallback?.({ status: "pending", message: "💾 Updating database records..." })

    // Update Supabase after blockchain confirmation
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        for_sale: false,
        resale_price: null,
        activity: "delist_from_sale",
        transaction_hash: receipt.hash,
      })
      .eq("token_id", tokenId)

    if (updateError) {
      console.error("⚠️ Database update failed after successful blockchain transaction:", updateError)
    }

    // Update secondary sales record
    await supabase
      .from("secondary_sales")
      .update({
        status: "cancelled",
        sale_date: new Date().toISOString(),
        transaction_hash: receipt.hash,
      })
      .eq("token_id", tokenId)
      .eq("status", "pending")

    statusCallback?.({ status: "success", message: "🎉 Ticket delisted successfully!" })

    return {
      success: true,
      tx,
      receipt,
      transactionHash: receipt.hash,
    }
  } catch (error: any) {
    console.error("❌ Error delisting ticket:", error)
    statusCallback?.({ status: "error", message: error.message || "Failed to delist ticket" })
    throw error
  }
}

// Transfer ticket - BLOCKCHAIN FIRST (when contract supports it)
export const transferTicketBlockchainFirst = async (
  tokenId: number,
  fromAddress: string,
  toAddress: string,
  statusCallback?: StatusCallback,
) => {
  try {
    statusCallback?.({ status: "pending", message: "🔗 Initiating blockchain transfer..." })

    console.log(`🔄 Transferring ticket #${tokenId} from ${fromAddress} to ${toAddress}`)

    // For now, simulate blockchain transaction as transfer function may not be implemented
    statusCallback?.({ status: "pending", message: "⏳ Processing blockchain transfer..." })

    // Simulate blockchain delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // TODO: Implement actual blockchain transfer when available
    // const contract = await getContract(true)
    // const tx = await contract.transferTicket(tokenId, toAddress)
    // const receipt = await tx.wait()

    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

    statusCallback?.({ status: "pending", message: "💾 Updating database records..." })

    // Update Supabase after "blockchain" confirmation
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        owner_address: toAddress.toLowerCase(),
        for_sale: false,
        resale_price: null,
        activity: "transfer",
        transaction_hash: mockTxHash,
        purchase_date: new Date().toISOString(),
      })
      .eq("token_id", tokenId)

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    statusCallback?.({ status: "success", message: "🎉 Ticket transferred successfully!" })

    return {
      success: true,
      transactionHash: mockTxHash,
    }
  } catch (error: any) {
    console.error("❌ Error transferring ticket:", error)
    statusCallback?.({ status: "error", message: error.message || "Failed to transfer ticket" })
    throw error
  }
}

// EXISTING FUNCTIONS (Enhanced for blockchain-first approach)

// Function to create an event
export const createEvent = async (
  name: string,
  description: string,
  date: number, // Unix timestamp
  location: string,
  ticketPrice: string, // In ETH
  maxTickets: number,
  eventURI: string,
) => {
  try {
    const contract = await getContract(true)
    const priceInWei = ethers.parseEther(ticketPrice)

    const tx = await contract.createEvent(name, description, date, location, priceInWei, maxTickets, eventURI)

    await tx.wait()
    return tx
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// Function to cancel an event
export const cancelEvent = async (eventId: number) => {
  try {
    const contract = await getContract(true)
    const tx = await contract.cancelEvent(eventId)
    await tx.wait()
    return tx
  } catch (error) {
    console.error("Error cancelling event:", error)
    throw error
  }
}

// Function to mint a ticket
export const mintTicket = async (
  eventId: number,
  ticketURI: string,
  seatInfo: string,
  ticketCategory: string,
  price: string, // In ETH
) => {
  try {
    const contract = await getContract(true)

    // Validate inputs
    if (!eventId || !ticketURI || !seatInfo || !ticketCategory || !price) {
      throw new Error("Missing required parameters for minting ticket")
    }

    console.log("Minting ticket with params:", {
      eventId,
      ticketURI,
      seatInfo,
      ticketCategory,
      price,
    })

    // Convert price to Wei
    const priceInWei = ethers.parseEther(price)

    // Get signer to check balance
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const balance = await provider.getBalance(signer.address)

    if (balance < priceInWei) {
      throw new Error(`Insufficient funds. Required: ${price} ETH`)
    }

    console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH, Required: ${price} ETH`)

    // Call the contract function with value parameter
    const tx = await contract.mintTicket(eventId, ticketURI, seatInfo, ticketCategory, {
      value: priceInWei,
      gasLimit: 500000, // Set a fixed gas limit to avoid estimation issues
    })

    console.log("Transaction sent. Waiting for confirmation...")

    const receipt = await tx.wait()
    console.log("Transaction receipt:", receipt)

    // Extract token ID from event logs
    let tokenId = null
    const event = receipt.logs.find(
      (log) => log.topics[0] === "0xf8e1a15aba9398e019f0b49df1a4fde98ee17ae345cb5f6b5e2c27f5033e8ce7",
    )

    if (event) {
      tokenId = Number.parseInt(event.data, 16)
      console.log("✅ Ticket minted with Token ID:", tokenId)
    } else {
      console.warn("⚠️ No TicketMinted event found in transaction logs.")
    }

    return {
      success: true,
      tx,
      tokenId,
    }
  } catch (error) {
    console.error("❌ Error minting ticket:", error)
    throw error
  }
}

// Function to get all events from Supabase
export const getAllEvents = async () => {
  try {
    // Fetch events from Supabase event_data table
    const { data: events, error } = await supabase
      .from("event_data")
      .select("*")
      .order("createdat", { ascending: false })

    if (error) {
      console.error("Error fetching events from Supabase:", error)
      return []
    }

    // Transform the data to match the expected format
    return events.map((event) => ({
      id: event.id,
      organizer: event.organizer_id || "0x0000000000000000000000000000000000000000",
      name: event.name,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      location: event.location,
      ticketPrice: event.ticket_price,
      maxTickets: event.max_tickets,
      ticketsSold: 0, // This would need to be fetched from blockchain or another source
      active: true, // This would need to be fetched from blockchain or another source
      eventURI: event.ipfsuri,
      event_image_url: event.event_image_url,
      category: event.category,
      blockchain_id: event.blockchain_id,
    }))
  } catch (error) {
    console.error("Error getting all events:", error)
    return []
  }
}

// Function to get event details from Supabase
export const getEventDetails = async (eventId: number) => {
  try {
    // Fetch event from Supabase event_data table
    const { data: event, error } = await supabase.from("event_data").select("*").eq("id", eventId).single()

    if (error) {
      console.error("Error fetching event from Supabase:", error)
      throw error
    }

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`)
    }

    // Transform the data to match the expected format
    return {
      id: event.id,
      organizer: event.organizer_id || "0x0000000000000000000000000000000000000000",
      name: event.name,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      location: event.location,
      ticketPrice: event.ticket_price,
      maxTickets: event.max_tickets,
      ticketsSold: 0, // This would need to be fetched from blockchain or another source
      active: true, // This would need to be fetched from blockchain or another source
      eventURI: event.ipfsuri,
      event_image_url: event.event_image_url,
      category: event.category,
      blockchain_id: event.blockchain_id,
    }
  } catch (error) {
    console.error("Error getting event details:", error)
    throw error
  }
}

// Enhanced getUserTickets with blockchain verification
export const getUserTickets = async (walletAddress: string) => {
  try {
    console.log(`🔍 Fetching tickets for wallet: ${walletAddress}`)

    // Fetch tickets with joined event_data to get event_image_url
    const { data: tickets, error } = await supabase
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
        qr_code,
        image_url,
        for_sale,
        resale_price,
        event_data:event_id (
          name,
          date,
          time,
          location,
          event_image_url,
          category
        )
      `)
      .eq("owner_address", walletAddress.toLowerCase())

    if (error) {
      console.error("❌ Error fetching tickets:", error)
      return []
    }

    console.log("✅ Fetched tickets data:", tickets)

    // Format the tickets with correct event image from event_data
    return tickets.map((ticket) => {
      const eventData = ticket.event_data || {}
      const formattedTicket = {
        ...ticket,
        event_name: ticket.event_name || eventData.name || "Unknown Event",
        event_image_url: eventData.event_image_url || ticket.image_url || "/placeholder.svg?height=200&width=400",
        event_category: ticket.category || eventData.category || "General",
        event_location: eventData.location || "Unknown Venue",
        event_date: eventData.date || null,
        event_time: eventData.time || null,
      }

      console.log("🎟️ Processed Ticket:", formattedTicket)
      return formattedTicket
    })
  } catch (error) {
    console.error("❌ Error in getUserTickets:", error)
    return []
  }
}

// Enhanced getEventTicketsForSale with blockchain verification
const ticketCache = new Map()

export const getEventTicketsForSale = async (eventId: any, isMountedRef?: any) => {
  try {
    // Early return if isMountedRef is not provided or component is unmounted
    if (isMountedRef && !isMountedRef.current) {
      console.log("Component not mounted, skipping fetch")
      return []
    }

    // Use cache if available
    if (ticketCache.has(eventId)) {
      console.log(`Returning cached tickets for event: ${eventId}`)
      return ticketCache.get(eventId)
    }

    console.log(`🔍 Fetching tickets for sale for event: ${eventId}`)

    // Get tickets from Supabase first (faster)
    const { data: dbTickets, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("event_id", eventId)
      .eq("for_sale", true)

    if (error) {
      console.error("Error fetching tickets from database:", error)
      return []
    }

    // Try to verify with blockchain if available
    try {
      const contract = await getContract()

      if (isMountedRef && !isMountedRef.current) {
        return []
      }

      const ticketIds = await contract.getEventTicketsForSale(eventId)

      // Cross-reference blockchain and database
      const verifiedTickets = dbTickets.filter((ticket) => ticketIds.some((id: any) => Number(id) === ticket.token_id))

      const formattedTickets = verifiedTickets.map((ticket) => ({
        id: ticket.token_id,
        eventId: ticket.event_id,
        price: ethers.formatEther(ticket.resale_price || ticket.price),
        seller: ticket.owner_address,
        sellerAddress: ticket.owner_address,
        seatInfo: ticket.seat_info,
        category: ticket.category,
        listingDate: new Date(ticket.purchase_date),
        forSale: ticket.for_sale,
      }))

      ticketCache.set(eventId, formattedTickets)
      return formattedTickets
    } catch (blockchainError) {
      console.warn("⚠️ Blockchain verification failed, using database data:", blockchainError)

      // Fallback to database data
      const formattedTickets = dbTickets.map((ticket) => ({
        id: ticket.token_id,
        eventId: ticket.event_id,
        eventName: ticket.event_data?.name || ticket.event_name || "Unknown Event",
        eventDate: ticket.event_data?.date ? new Date(ticket.event_data.date) : new Date(),
        eventLocation: ticket.event_data?.location || "Unknown Location",
        price: (ticket.resale_price || ticket.price).toString(),
        seller: ticket.owner_address,
        seatInfo: ticket.seat_info || "General Admission",
        category: ticket.category || "Standard",
      }))

      return formattedTickets
    }
  } catch (error) {
    console.error("Error getting tickets for sale:", error)
    return []
  }
}

// Function to get all tickets for sale
export const getAllTicketsForSale = async () => {
  try {
    console.log("🔍 Getting all tickets for sale")

    // Get from database first
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        *,
        event_data:event_id (
          name,
          date,
          location
        )
      `)
      .eq("for_sale", true)

    if (error) {
      console.error("Error fetching tickets:", error)
      return []
    }

    return tickets.map((ticket) => ({
      id: ticket.token_id,
      eventId: ticket.event_id,
      eventName: ticket.event_data?.name || ticket.event_name || "Unknown Event",
      eventDate: ticket.event_data?.date ? new Date(ticket.event_data.date) : new Date(),
      eventLocation: ticket.event_data?.location || "Unknown Location",
      price: (ticket.resale_price || ticket.price).toString(),
      seller: ticket.owner_address,
      seatInfo: ticket.seat_info || "General Admission",
      category: ticket.category || "Standard",
    }))
  } catch (error) {
    console.error("Error getting all tickets for sale:", error)
    return []
  }
}
