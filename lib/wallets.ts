// Wallet connection utilities

// Format wallet address for display
export function formatWalletAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Silently check if MetaMask is connected without triggering popup
export async function checkMetaMaskConnection() {
  try {
    if (!window.ethereum) {
      return { connected: false, address: null }
    }

    // Use eth_accounts which doesn't trigger a popup
    const accounts = await window.ethereum.request({ method: "eth_accounts" })

    if (accounts && accounts.length > 0) {
      return { connected: true, address: accounts[0] }
    }

    return { connected: false, address: null }
  } catch (error) {
    console.error("Error checking MetaMask connection:", error)
    return { connected: false, address: null }
  }
}

// Connect to MetaMask wallet - only call this on explicit user action
export async function connectMetaMask() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask and try again.")
    }

    // This will trigger the MetaMask popup - only call on explicit user action
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please check your MetaMask configuration.")
    }

    return {
      address: accounts[0],
      walletType: "metamask",
    }
  } catch (error) {
    console.error("MetaMask connection error:", error)
    throw error
  }
}

// Silently check if Phantom is connected without triggering popup
export async function checkPhantomConnection() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      return { connected: false, address: null }
    }

    // Check if already connected without triggering popup
    if (window.solana.isConnected) {
      return {
        connected: true,
        address: window.solana.publicKey?.toString() || null,
      }
    }

    return { connected: false, address: null }
  } catch (error) {
    console.error("Error checking Phantom connection:", error)
    return { connected: false, address: null }
  }
}

// Connect to Phantom wallet - only call this on explicit user action
export async function connectPhantom() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom wallet is not installed. Please install Phantom and try again.")
    }

    // This will trigger the Phantom popup - only call on explicit user action
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

// Declare global window interface to avoid TypeScript errors
declare global {
  interface Window {
    ethereum?: any
    solana?: any
  }
}
