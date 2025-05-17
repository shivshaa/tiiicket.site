"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"

type WalletContextType = {
  address: string | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  balance: null,
  isConnected: false,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
})

export const useWallet = () => useContext(WalletContext)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if wallet was previously connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()

          if (accounts.length > 0) {
            const address = accounts[0].address
            setAddress(address)

            const balance = await provider.getBalance(address)
            setBalance(ethers.formatEther(balance))

            setIsConnected(true)
          }
        } catch (error) {
          console.error("Failed to check wallet connection:", error)
        }
      }
    }

    checkConnection()
  }, [])

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask browser extension to connect",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (accounts.length > 0) {
        const address = accounts[0]
        setAddress(address)

        const balance = await provider.getBalance(address)
        setBalance(ethers.formatEther(balance))

        setIsConnected(true)

        toast({
          title: "Wallet connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        })
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setBalance(null)
    setIsConnected(false)

    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected,
        isConnecting,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

