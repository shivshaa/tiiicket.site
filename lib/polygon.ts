import { ethers } from "ethers"
import { magic } from "./magic"

// Initialize provider with Polygon RPC endpoint
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com")

/**
 * Fetches wallet balance from Polygon network
 * @param address Wallet address
 * @returns Balance in MATIC with proper formatting
 */
export async function getPolygonBalance(address: string): Promise<string> {
  try {
    // Validate address format
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid wallet address format")
    }

    // Get balance in wei
    const balanceWei = await provider.getBalance(address)

    // Convert wei to MATIC (18 decimals)
    const balanceMatic = ethers.formatEther(balanceWei)

    // Format to 4 decimal places for display
    return Number.parseFloat(balanceMatic).toFixed(4)
  } catch (error) {
    console.error("Error fetching Polygon balance:", error)
    return "0.0000"
  }
}

/**
 * Gets the wallet balance using Magic provider
 * @returns Balance in MATIC with proper formatting
 */
export async function getMagicWalletBalance(): Promise<string> {
  try {
    if (!magic) throw new Error("Magic not initialized")

    const userInfo = await magic.user.getInfo()
    if (!userInfo.publicAddress) throw new Error("No wallet address found")

    return await getPolygonBalance(userInfo.publicAddress)
  } catch (error) {
    console.error("Error fetching Magic wallet balance:", error)
    return "0.0000"
  }
}
