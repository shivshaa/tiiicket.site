"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface UserSession {
  wallet_address: string
  wallet_type: string
  username: string
  email: string
  auth_method: string
}

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: () => {},
  refreshUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const refreshUser = () => {
    try {
      const sessionData = localStorage.getItem("userSession")
      if (sessionData) {
        const userData = JSON.parse(sessionData) as UserSession
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const signOut = () => {
    localStorage.removeItem("userSession")
    setUser(null)
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
