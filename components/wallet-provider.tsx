"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WalletContextType {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  checkConnection: () => Promise<boolean>
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  checkConnection: async () => false,
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false)

  // Silently check if wallet is already connected on component mount
  // This uses eth_accounts which doesn't trigger a popup
  useEffect(() => {
    const silentConnectionCheck = async () => {
      if (typeof window !== "undefined" && window.ethereum && !hasCheckedConnection) {
        try {
          // Get stored address from localStorage
          const storedAddress = localStorage.getItem("walletAddress")

          if (storedAddress) {
            // Use eth_accounts which doesn't trigger a popup
            const accounts = await window.ethereum.request({ method: "eth_accounts" })

            if (accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
              setAddress(accounts[0])
              setIsConnected(true)
            } else {
              // Clear stored address if it doesn't match
              localStorage.removeItem("walletAddress")
            }
          }

          setHasCheckedConnection(true)
        } catch (error) {
          console.error("Error during silent connection check:", error)
          // Don't update connection state on error
          setHasCheckedConnection(true)
        }
      } else {
        setHasCheckedConnection(true)
      }
    }

    silentConnectionCheck()
  }, [hasCheckedConnection])

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

  // Check connection status without triggering popup
  const checkConnection = async (): Promise<boolean> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        return accounts.length > 0
      } catch (error) {
        console.error("Error checking connection:", error)
        return false
      }
    }
    return false
  }

  // Connect wallet only when explicitly requested by user
  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setIsConnecting(true)

        // This will trigger the MetaMask popup
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          localStorage.setItem("walletAddress", accounts[0])
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)
        // Show user-friendly error message
        if (error.code === 4001) {
          // User rejected the connection request
          console.log("User rejected the connection request")
        }
      } finally {
        setIsConnecting(false)
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
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        connectWallet,
        disconnectWallet,
        checkConnection,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
