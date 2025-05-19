"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useWallet } from "@/components/wallet-provider"
import { getUserTickets, getAllEvents, getEventTicketsForSale, getAllTicketsForSale } from "@/lib/contract"

interface BlockchainContextType {
  userTickets: any[]
  loadingTickets: boolean
  refreshUserTickets: () => Promise<void>
  events: any[]
  loadingEvents: boolean
  refreshEvents: () => Promise<void>
  getTicketsForEvent: (eventId: number) => Promise<any[]>
  loadingEventTickets: boolean
  marketplaceTickets: any[]
  loadingMarketplace: boolean
  refreshMarketplace: () => Promise<void>
}

const BlockchainContext = createContext<BlockchainContextType>({
  userTickets: [],
  loadingTickets: false,
  refreshUserTickets: async () => {},
  events: [],
  loadingEvents: false,
  refreshEvents: async () => {},
  getTicketsForEvent: async () => [],
  loadingEventTickets: false,
  marketplaceTickets: [],
  loadingMarketplace: false,
  refreshMarketplace: async () => {},
})

// Create a unique key for the context to prevent duplicate context issues
const BlockchainContextKey = "blockchain-context"

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useWallet()
  const [userTickets, setUserTickets] = useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [loadingEventTickets, setLoadingEventTickets] = useState(false)
  const [marketplaceTickets, setMarketplaceTickets] = useState<any[]>([])
  const [loadingMarketplace, setLoadingMarketplace] = useState(false)

  // Fetch user tickets when connected
  useEffect(() => {
    if (isConnected && address) {
      refreshUserTickets()
    } else {
      setUserTickets([])
    }
  }, [isConnected, address])

  // Fetch events on load
  useEffect(() => {
    refreshEvents()
  }, [])

  // Fetch marketplace tickets on load
  useEffect(() => {
    refreshMarketplace()
  }, [])

  const refreshUserTickets = async () => {
    if (!isConnected || !address) return

    setLoadingTickets(true)
    try {
      const tickets = await getUserTickets(address)
      // Ensure we always have an array
      setUserTickets(Array.isArray(tickets) ? tickets : [])
    } catch (error) {
      console.error("Error fetching user tickets:", error)
      setUserTickets([])
    } finally {
      setLoadingTickets(false)
    }
  }

  const refreshEvents = async () => {
    setLoadingEvents(true)
    try {
      const allEvents = await getAllEvents()
      // Ensure we always have an array
      setEvents(Array.isArray(allEvents) ? allEvents : [])
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  const getTicketsForEvent = async (eventId: number) => {
    setLoadingEventTickets(true)
    try {
      const tickets = await getEventTicketsForSale(eventId)
      // Ensure we always return an array
      return Array.isArray(tickets) ? tickets : []
    } catch (error) {
      console.error("Error fetching tickets for event:", error)
      return []
    } finally {
      setLoadingEventTickets(false)
    }
  }

  const refreshMarketplace = async () => {
    setLoadingMarketplace(true)
    try {
      const tickets = await getAllTicketsForSale()
      // Ensure we always have an array
      setMarketplaceTickets(Array.isArray(tickets) ? tickets : [])
    } catch (error) {
      console.error("Error fetching marketplace tickets:", error)
      setMarketplaceTickets([])
    } finally {
      setLoadingMarketplace(false)
    }
  }

  return (
    <BlockchainContext.Provider
      value={{
        userTickets,
        loadingTickets,
        refreshUserTickets,
        events,
        loadingEvents,
        refreshEvents,
        getTicketsForEvent,
        loadingEventTickets,
        marketplaceTickets,
        loadingMarketplace,
        refreshMarketplace,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
}

export const useBlockchain = () => useContext(BlockchainContext)
