// Wallet connection utilities with improved detection

// Format wallet address for display
export function formatWalletAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Check if we're in a browser environment
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Check if any Ethereum provider exists
export function hasEthereumProvider(): boolean {
  return isBrowser() && !!window.ethereum
}

// Check if MetaMask is specifically installed
export function isMetaMaskInstalled(): boolean {
  if (!isBrowser() || !window.ethereum) return false

  // MetaMask sets isMetaMask to true
  return window.ethereum.isMetaMask === true
}

// Connect to MetaMask wallet with improved error handling
export async function connectMetaMask() {
  try {
    if (!isBrowser()) {
      throw new Error("Please use a web browser to connect your wallet.")
    }

    if (!hasEthereumProvider()) {
      throw new Error("No Ethereum wallet detected. Please install MetaMask.")
    }

    if (!isMetaMaskInstalled()) {
      throw new Error("MetaMask not detected. Please install MetaMask or switch to MetaMask.")
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask and try again.")
    }

    return {
      address: accounts[0],
      walletType: "metamask",
    }
  } catch (error: any) {
    console.error("MetaMask connection error:", error)

    // Handle specific error codes
    if (error.code === 4001) {
      throw new Error("Connection rejected by user")
    } else if (error.code === -32002) {
      throw new Error("Connection request already pending. Please check MetaMask.")
    }

    throw error
  }
}

// Connect to Phantom wallet (Solana) - keeping for compatibility
export async function connectPhantom() {
  try {
    if (!isBrowser()) {
      throw new Error("Please use a web browser to connect your wallet.")
    }

    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom wallet is not installed. Please install Phantom and try again.")
    }

    // Connect to Phantom
    const response = await window.solana.connect()

    return {
      address: response.publicKey.toString(),
      walletType: "phantom",
    }
  } catch (error) {
    console.error("Phantom connection error:", error)
    throw error
  }
}

// Get current network information
export async function getCurrentNetwork() {
  try {
    if (!hasEthereumProvider()) return null

    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId
  } catch (error) {
    console.error("Error getting network:", error)
    return null
  }
}

// Get wallet balance
export async function getWalletBalance(address: string): Promise<string> {
  try {
    if (!hasEthereumProvider()) return "0"

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

// Declare global window interface to avoid TypeScript errors
declare global {
  interface Window {
    ethereum?: any
    solana?: any
  }
}
