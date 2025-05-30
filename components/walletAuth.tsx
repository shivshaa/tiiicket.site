"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield, Wallet, CheckCircle, AlertCircle } from "lucide-react"

interface NetworkInfo {
  chainId: string
  name: string
  isSupported: boolean
}

interface WalletState {
  address: string
  balance: string
  network: NetworkInfo | null
  isConnected: boolean
  isConnecting: boolean
  isSigningMessage: boolean
  isVerifying: boolean
}

interface WalletAuthProps {
  onAuthSuccess: (userData: any) => void
  onAuthError: (error: string) => void
}

const SUPPORTED_NETWORKS: Record<string, NetworkInfo> = {
  "0x89": { chainId: "0x89", name: "Polygon Mainnet", isSupported: true },
  "0x13882": { chainId: "0x13882", name: "Polygon Amoy Testnet", isSupported: true },
}

export default function WalletAuth({ onAuthSuccess, onAuthError }: WalletAuthProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    address: "",
    balance: "0",
    network: null,
    isConnected: false,
    isConnecting: false,
    isSigningMessage: false,
    isVerifying: false,
  })

  const { toast } = useToast()

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum && window.ethereum.isMetaMask
  }

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format balance for display
  const formatBalance = (balance: string) => {
    const num = Number.parseFloat(balance)
    if (num === 0) return "0"
    if (num < 0.001) return "< 0.001"
    return num.toFixed(4)
  }

  // Get network information
  const getNetworkInfo = (chainId: string): NetworkInfo => {
    return (
      SUPPORTED_NETWORKS[chainId] || {
        chainId,
        name: "Unknown Network",
        isSupported: false,
      }
    )
  }

  // Get wallet balance
  const getWalletBalance = async (address: string): Promise<string> => {
    try {
      if (!window.ethereum) return "0"

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      // Convert from wei to ether
      const balanceInEther = Number.parseInt(balance, 16) / Math.pow(10, 18)
      return balanceInEther.toString()
    } catch (error) {
      console.error("Error getting balance:", error)
      return "0"
    }
  }

  // Get current network
  const getCurrentNetwork = async (): Promise<NetworkInfo | null> => {
    try {
      if (!window.ethereum) return null

      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      return getNetworkInfo(chainId)
    } catch (error) {
      console.error("Error getting network:", error)
      return null
    }
  }

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      onAuthError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true }))

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      const address = accounts[0]
      const balance = await getWalletBalance(address)
      const network = await getCurrentNetwork()

      setWalletState((prev) => ({
        ...prev,
        address,
        balance,
        network,
        isConnected: true,
        isConnecting: false,
      }))

      toast({
        title: "Wallet Connected",
        description: `Connected to ${formatAddress(address)}`,
      })

      // Check if network is supported
      if (network && !network.isSupported) {
        toast({
          title: "Unsupported Network",
          description: "Please switch to Polygon Mainnet or Amoy Testnet",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        isConnected: false,
      }))
      onAuthError(`Failed to connect wallet: ${error.message}`)
    }
  }

  // Generate nonce from Supabase Edge Function (external server)
  const generateNonce = async (walletAddress: string) => {
    try {
      console.log("Generating nonce for address:", walletAddress)
      
      const response = await fetch("https://supabase-edge-function.onrender.com/nonce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: walletAddress }),
      })

      console.log("Nonce response status:", response.status)
      console.log("Nonce response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Nonce generation failed:", errorText)
        throw new Error(`Failed to generate nonce: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Nonce response data:", data)

      if (!data.nonce) {
        throw new Error("Nonce not found in response")
      }

      return {
        nonce: data.nonce,
        message: `Sign this message to authenticate. Nonce: ${data.nonce}`,
      }
    } catch (error) {
      console.error("Error generating nonce:", error)
      throw new Error(`Failed to generate authentication nonce: ${error.message}`)
    }
  }

  // Verify signature with Supabase Edge Function
  const verifySignature = async (message: string, signature: string, walletAddress: string) => {
    try {
      const payload = {
        message,
        signature,
        walletAddress: walletAddress, // Server expects `walletAddress`
      }

      console.log("Sending verification payload:", payload)

      const response = await fetch('https://supabase-edge-function.onrender.com/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      })

      console.log("Verification response status:", response.status)
      console.log("Verification response headers:", Object.fromEntries(response.headers.entries()))

      // Get response text first to debug
      const responseText = await response.text()
      console.log("Verification response text:", responseText)

      if (!response.ok) {
        console.error(`Verification failed with status ${response.status}:`, responseText)
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${responseText}`)
      }

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        throw new Error(`Invalid JSON response from server: ${responseText}`)
      }

      console.log("Verification response data:", data)
      
      // Transform server response to match frontend expectations
      return {
        success: data.valid, // Server returns 'valid', frontend expects 'success'
        message: data.message,
        token: `auth_${Date.now()}_${walletAddress.slice(0, 8)}`, // Generate a simple token
        user: {
          address: walletAddress,
          authenticatedAt: data.timestamp || new Date().toISOString()
        }
      }
    } catch (error) {
      console.error("Error verifying signature:", error)
      throw error
    }
  }

  // Sign message with MetaMask
  const signMessage = async (message: string, address: string): Promise<string> => {
    try {
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })
      return signature
    } catch (error) {
      console.error("Error signing message:", error)
      throw error
    }
  }

  // Authenticate with wallet
  const authenticateWallet = async () => {
    if (!walletState.isConnected || !walletState.address) {
      onAuthError("Please connect your wallet first")
      return
    }

    if (walletState.network && !walletState.network.isSupported) {
      onAuthError("Please switch to a supported network (Polygon Mainnet or Amoy Testnet)")
      return
    }

    try {
      setWalletState((prev) => ({ ...prev, isSigningMessage: true }))

      // Step 1: Get nonce + message
      const { nonce, message } = await generateNonce(walletState.address)

      // Step 2: Sign the message
      const signature = await signMessage(message, walletState.address)

      setWalletState((prev) => ({ ...prev, isSigningMessage: false, isVerifying: true }))

      // Step 3: Verify the signature
      const verificationResult = await verifySignature(message, signature, walletState.address)

      if (!verificationResult.success) {
        throw new Error(`Authentication failed: ${verificationResult.error || 'Unknown error'}`)
      }

      // Save the auth token and user data (Note: localStorage won't work in artifacts)
      // In a real app, you would use localStorage here
      // localStorage.setItem("auth_token", verificationResult.token)
      // localStorage.setItem("user_data", JSON.stringify(verificationResult.user))

      setWalletState((prev) => ({ ...prev, isVerifying: false }))

      toast({
        title: "Authentication Successful",
        description: "You have been securely authenticated!",
      })

      onAuthSuccess(verificationResult.user)
    } catch (error: any) {
      console.error("Authentication error:", error)
      setWalletState((prev) => ({
        ...prev,
        isSigningMessage: false,
        isVerifying: false,
      }))

      let errorMessage = "Authentication failed"
      if (error.message.includes("User rejected")) {
        errorMessage = "Authentication cancelled by user"
      } else if (error.message.includes("nonce")) {
        errorMessage = "Authentication nonce expired. Please try again."
      } else if (error.message.includes("Server error")) {
        errorMessage = `Server error: ${error.message}`
      } else {
        errorMessage = error.message || "Authentication failed"
      }

      onAuthError(errorMessage)
    }
  }

  // Listen for account and network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletState({
          address: "",
          balance: "0",
          network: null,
          isConnected: false,
          isConnecting: false,
          isSigningMessage: false,
          isVerifying: false,
        })
      } else {
        connectWallet()
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)
        }
      }
    }
  }, [])

  const getButtonText = () => {
    if (walletState.isVerifying) return "Verifying Signature..."
    if (walletState.isSigningMessage) return "Please Sign Message..."
    if (walletState.isConnecting) return "Connecting..."
    if (!walletState.isConnected) return "Connect MetaMask"
    return "Authenticate Wallet"
  }

  const isLoading = walletState.isConnecting || walletState.isSigningMessage || walletState.isVerifying

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          MetaMask Authentication
        </CardTitle>
        <CardDescription>Secure wallet-based authentication using cryptographic signatures</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMetaMaskInstalled() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>MetaMask is not installed. Please install MetaMask to continue.</AlertDescription>
          </Alert>
        )}

        {walletState.isConnected && (
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>
                    <strong>Address:</strong> {formatAddress(walletState.address)}
                  </div>
                  <div>
                    <strong>Balance:</strong> {formatBalance(walletState.balance)} MATIC
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {walletState.network && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network:</span>
                <Badge variant={walletState.network.isSupported ? "default" : "destructive"}>
                  {walletState.network.name}
                </Badge>
              </div>
            )}
          </div>
        )}

        {walletState.isSigningMessage && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>Please check MetaMask and sign the authentication message</AlertDescription>
          </Alert>
        )}

        {walletState.isVerifying && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Verifying your signature with our secure servers...</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={walletState.isConnected ? authenticateWallet : connectWallet}
          disabled={isLoading || !isMetaMaskInstalled()}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {getButtonText()}
        </Button>

        {walletState.network && !walletState.network.isSupported && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please switch to Polygon Mainnet (Chain ID: 137) or Polygon Amoy Testnet (Chain ID: 80002)
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
