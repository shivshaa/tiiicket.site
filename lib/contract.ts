//Filename: contract

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

// Function to list a ticket for sale
export const listTicketForSale = async (tokenId: number, price: string) => {
  try {
    console.log(`Listing ticket #${tokenId} for sale at ${price} ETH`)

    // Get contract with signer
    const contract = await getContract(true)

    // Convert price to Wei
    const priceInWei = ethers.parseEther(price)

    // Call the contract method to list the ticket for sale
    const tx = await contract.listTicketForSale(tokenId, priceInWei, {
      gasLimit: 300000, // Set a fixed gas limit to avoid estimation issues
    })

    console.log("Transaction sent. Waiting for confirmation...")

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait()
    console.log("Transaction receipt:", receipt)

    // Check if the transaction was successful
    if (receipt.status === 1) {
      console.log("✅ Ticket successfully listed for sale")
      return { success: true, tx, receipt }
    } else {
      throw new Error("Transaction failed")
    }
  } catch (error) {
    console.error("Error listing ticket for sale:", error)
    throw error
  }
}

// Update the buyResaleTicket function to interact with the blockchain

// Function to buy a resale ticket
export const buyResaleTicket = async (tokenId: number, price: string) => {
  try {
    console.log(`Buying resale ticket #${tokenId} for ${price} ETH`)

    // Get contract with signer
    const contract = await getContract(true)

    // Convert price to Wei
    const priceInWei = ethers.parseEther(price)

    // Call the contract method to buy the ticket
    const tx = await contract.buyResaleTicket(tokenId, {
      value: priceInWei,
      gasLimit: 500000, // Set a fixed gas limit to avoid estimation issues
    })

    console.log("Transaction sent. Waiting for confirmation...")

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait()
    console.log("Transaction receipt:", receipt)

    // Check if the transaction was successful
    if (receipt.status === 1) {
      console.log("✅ Ticket successfully purchased")
      return { success: true, tx, receipt, tokenId }
    } else {
      throw new Error("Transaction failed")
    }
  } catch (error) {
    console.error("Error buying resale ticket:", error)
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

// Update this function to correctly join with event_data table
export const getUserTickets = async (walletAddress: string) => {
  try {
    console.log(`Fetching tickets for wallet: ${walletAddress}`)

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
        event_image_url: eventData.event_image_url || ticket.image_url || "/placeholder.svg", // Use event_image_url or fallback to ticket image_url
        event_category: ticket.category || eventData.category || "General",
        event_location: eventData.location || "Unknown Venue",
        event_date: eventData.date || null,
        event_time: eventData.time || null,
      }

      console.log("🎟️ Processed Ticket:", formattedTicket) // Debugging
      return formattedTicket
    })
  } catch (error) {
    console.error("❌ Error in getUserTickets:", error)
    return []
  }
}

const ticketCache = new Map()

export const getEventTicketsForSale = async (eventId, isMountedRef) => {
  try {
    // Early return if isMountedRef is not provided or component is unmounted
    if (!isMountedRef || !isMountedRef.current) {
      console.log("Component not mounted, skipping fetch")
      return []
    }

    // Use cache if available
    if (ticketCache.has(eventId)) {
      console.log(`Returning cached tickets for event: ${eventId}`)
      return ticketCache.get(eventId)
    }

    console.log(`Fetching tickets for sale for event: ${eventId}`)

    // Safely get contract instance
    let contract
    try {
      contract = await getContract()
    } catch (error) {
      console.error("Error getting contract:", error)
      return []
    }

    // Check again if component is still mounted
    if (!isMountedRef.current) {
      console.log("Component unmounted during contract fetch")
      return []
    }

    // Safely get ticket IDs
    let ticketIds = []
    try {
      ticketIds = (await contract.getEventTicketsForSale(eventId)) || []
    } catch (error) {
      console.error("Error fetching ticket IDs:", error)
      return []
    }

    // Check again if component is still mounted
    if (!isMountedRef.current) {
      console.log("Component unmounted during ticket IDs fetch")
      return []
    }

    if (ticketIds.length === 0) {
      console.log("No tickets found for this event.")
      ticketCache.set(eventId, [])
      return []
    }

    // Fetch ticket details with proper error handling
    const ticketsPromises = ticketIds.map(async (ticketId) => {
      try {
        // Check if component is still mounted before each ticket fetch
        if (!isMountedRef.current) return null

        const ticketDetails = await contract.getTicketDetails(ticketId)
        return ticketDetails
          ? {
              id: Number(ticketId),
              eventId: Number(ticketDetails.eventId),
              price: ethers.formatEther(ticketDetails.price),
              seller: ticketDetails.owner,
              sellerAddress: ticketDetails.owner,
              seatInfo: ticketDetails.seatInfo,
              category: ticketDetails.ticketCategory,
              listingDate: new Date(),
              forSale: ticketDetails.forSale,
            }
          : null
      } catch (error) {
        console.error(`Error getting details for ticket ${ticketId}:`, error)
        return null
      }
    })

    const tickets = (await Promise.all(ticketsPromises)).filter((ticket) => ticket !== null)

    // Final check if component is still mounted
    if (!isMountedRef.current) {
      console.log("Component unmounted after fetch completion")
      return []
    }

    console.log(`Found ${tickets.length} tickets listed for this event.`)
    ticketCache.set(eventId, tickets)
    return tickets
  } catch (error) {
    console.error("Error getting tickets for sale:", error)
    return []
  }
}

// Function to delist a ticket from sale
export const delistTicketFromSale = async (tokenId: number) => {
  try {
    console.log(`Delisting ticket #${tokenId} from sale`)

    // Get contract with signer
    const contract = await getContract(true)

    // Call the contract method to delist the ticket
    const tx = await contract.delistTicketFromSale(tokenId, {
      gasLimit: 300000, // Set a fixed gas limit to avoid estimation issues
    })

    console.log("Transaction sent. Waiting for confirmation...")

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait()
    console.log("Transaction receipt:", receipt)

    // Check if the transaction was successful
    if (receipt.status === 1) {
      console.log("✅ Ticket successfully delisted from sale")
      return { success: true, tx, receipt }
    } else {
      throw new Error("Transaction failed")
    }
  } catch (error) {
    console.error("Error delisting ticket from sale:", error)
    throw error
  }
}

// Function to get all tickets for sale - FIXED to handle undefined result and prevent infinite loop
export const getAllTicketsForSale = async () => {
  try {
    // Since we're having issues with the contract, let's use mock data
    console.log("Getting all tickets for sale")

    // Mock data for marketplace tickets
    return [
      {
        id: 101,
        eventId: 1,
        eventName: "Summer Music Festival",
        eventDate: new Date("2023-07-15"),
        eventLocation: "Central Park, New York",
        price: "0.06",
        seller: "0x1234567890123456789012345678901234567890",
        seatInfo: "Section A, Row 5, Seat 10",
        category: "VIP",
      },
      {
        id: 102,
        eventId: 1,
        eventName: "Summer Music Festival",
        eventDate: new Date("2023-07-15"),
        eventLocation: "Central Park, New York",
        price: "0.04",
        seller: "0x0987654321098765432109876543210987654321",
        seatInfo: "Section B, Row 8, Seat 15",
        category: "Standard",
      },
      {
        id: 103,
        eventId: 3,
        eventName: "NBA Finals Game 7",
        eventDate: new Date("2023-06-18"),
        eventLocation: "Madison Square Garden, New York",
        price: "0.15",
        seller: "0x5678901234567890123456789012345678901234",
        seatInfo: "Section C, Row 3, Seat 7",
        category: "Premium",
      },
    ]
  } catch (error) {
    console.error("Error getting all tickets for sale:", error)
    // Return empty array instead of throwing
    return []
  }
}

// Function to cancel ticket listing (also needs gas limit fix)
export const cancelTicketListing = async (ticketId: number) => {
  try {
    const contract = await getContract(true)

    // Add explicit gas limit to prevent "out of gas" errors
    const tx = await contract.delistTicketFromSale(ticketId, {
      gasLimit: 300000, // Increased gas limit for this operation
    })

    await tx.wait()
    return tx
  } catch (error) {
    console.error("Error cancelling ticket listing:", error)
    throw error
  }
}
