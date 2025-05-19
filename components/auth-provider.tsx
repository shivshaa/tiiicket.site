"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { checkMetaMaskConnection, checkPhantomConnection } from "@/lib/wallets"
import { magic } from "@/lib/magic"

interface User {
  wallet_address: string
  wallet_type: string
  username: string
  email: string
  auth_method: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
  refreshUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem("userSession")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Error loading user from storage:", error)
      // Clear potentially corrupted data
      localStorage.removeItem("userSession")
    }
    setIsLoading(false)
  }

  // Verify stored session on mount without triggering popups
  useEffect(() => {
    const verifySession = async () => {
      try {
        // First check local storage
        const storedUser = localStorage.getItem("userSession")

        if (!storedUser) {
          setIsLoading(false)
          return
        }

        const parsedUser = JSON.parse(storedUser)

        // Verify the session based on auth method without triggering popups
        if (parsedUser.auth_method === "email" && magic) {
          // For Magic Link, check if session is still valid
          const isLoggedIn = await magic.user.isLoggedIn()

          if (isLoggedIn) {
            setUser(parsedUser)
            setIsAuthenticated(true)
          } else {
            // Session expired, clear it
            localStorage.removeItem("userSession")
          }
        } else if (parsedUser.auth_method === "metamask") {
          // For MetaMask, check if still connected to the same address
          const { connected, address } = await checkMetaMaskConnection()

          if (connected && address && address.toLowerCase() === parsedUser.wallet_address.toLowerCase()) {
            setUser(parsedUser)
            setIsAuthenticated(true)
          } else {
            // Not connected or different address, clear session
            localStorage.removeItem("userSession")
          }
        } else if (parsedUser.auth_method === "phantom") {
          // For Phantom, check if still connected to the same address
          const { connected, address } = await checkPhantomConnection()

          if (connected && address && address.toLowerCase() === parsedUser.wallet_address.toLowerCase()) {
            setUser(parsedUser)
            setIsAuthenticated(true)
          } else {
            // Not connected or different address, clear session
            localStorage.removeItem("userSession")
          }
        }
      } catch (error) {
        console.error("Error verifying session:", error)
        // On error, clear session to be safe
        localStorage.removeItem("userSession")
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [])

  const signOut = async () => {
    try {
      const storedUser = localStorage.getItem("userSession")

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)

        // Perform logout based on auth method
        if (parsedUser.auth_method === "email" && magic) {
          await magic.user.logout()
        }
        // For wallet connections, we just remove the local session
      }
    } catch (error) {
      console.error("Error during sign out:", error)
    } finally {
      // Always clear local storage and state
      localStorage.removeItem("userSession")
      setUser(null)
      setIsAuthenticated(false)
      
      // We'll handle redirection in the component that calls this function
      return Promise.resolve();
    }
  }

  const refreshUser = () => {
    loadUserFromStorage()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
