// Wallet connection utilities

// Format wallet address for display
export function formatWalletAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Connect to MetaMask wallet
export async function connectMetaMask() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask and try again.")
    }

    // Request account access
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

// Connect to Phantom wallet (Solana)
export async function connectPhantom() {
  try {
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

// Declare global window interface to avoid TypeScript errors
declare global {
  interface Window {
    ethereum?: any
    solana?: any
  }
}
