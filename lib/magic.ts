import { Magic } from "magic-sdk"

// Initialize Magic only on the client side
let magic: Magic | null = null

if (typeof window !== "undefined") {
  try {
    magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY as string)
  } catch (error) {
    console.error("Failed to initialize Magic:", error)
  }
}

export { magic }

// **Updated helper function to use `getInfo()` instead of `getMetadata()`**
export const getUserInfo = async () => {
  if (!magic) return null
  try {
    return await magic.user.getInfo()
  } catch (error) {
    console.error("Error getting user info:", error)
    return null
  }
}

// **Updated wallet function to use `getInfo()`**
export const getUserWallet = async () => {
  if (!magic) return null
  try {
    const userInfo = await magic.user.getInfo()
    return {
      publicAddress: userInfo.publicAddress,
      network: "polygon-amoy",
    }
  } catch (error) {
    console.error("Error getting user wallet:", error)
    return null
  }
}

export const logout = async () => {
  if (!magic) return
  try {
    await magic.user.logout()
  } catch (error) {
    console.error("Error logging out:", error)
  }
}
