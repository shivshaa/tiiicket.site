"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // Check if we have a stored address
          const storedAddress = localStorage.getItem("walletAddress")

          if (storedAddress) {
            // Check if we're still connected to this address
            const accounts = await window.ethereum.request({ method: "eth_accounts" })

            if (accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
              setAddress(accounts[0])
              setIsConnected(true)
            } else {
              // Clear stored address if it doesn't match
              localStorage.removeItem("walletAddress")
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setIsConnected(false)
          setAddress(null)
          localStorage.removeItem("walletAddress")
        } else if (accounts[0] !== address) {
          // User switched accounts
          setAddress(accounts[0])
          setIsConnected(true)
          localStorage.setItem("walletAddress", accounts[0])
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [address])

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          localStorage.setItem("walletAddress", accounts[0])
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)
      }
    } else {
      alert("Please install MetaMask or another Ethereum wallet to use this feature.")
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress(null)
    localStorage.removeItem("walletAddress")
  }

  return (
    <WalletContext.Provider value={{ isConnected, address, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
