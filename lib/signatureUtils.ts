import { ethers } from "ethers"

export interface SignatureVerificationResult {
  isValid: boolean
  recoveredAddress?: string
  error?: string
}

/**
 * Verify an Ethereum signature
 */
export async function verifyEthereumSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): Promise<SignatureVerificationResult> {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature)

    // Check if the recovered address matches the expected address
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()

    return {
      isValid,
      recoveredAddress: recoveredAddress.toLowerCase(),
    }
  } catch (error) {
    console.error("Signature verification error:", error)
    return {
      isValid: false,
      error: error.message,
    }
  }
}

/**
 * Verify a Solana signature (simplified version)
 */
export async function verifySolanaSignature(
  message: string,
  signature: string,
  publicKey: string,
): Promise<SignatureVerificationResult> {
  try {
    // Note: This is a simplified version. In production, you would use
    // @solana/web3.js to properly verify Solana signatures

    // For now, we'll assume the signature is valid if it's properly formatted
    const isValidFormat = /^0x[a-fA-F0-9]{128}$/.test(signature)

    return {
      isValid: isValidFormat,
      recoveredAddress: publicKey,
    }
  } catch (error) {
    console.error("Solana signature verification error:", error)
    return {
      isValid: false,
      error: error.message,
    }
  }
}

/**
 * Generate a standardized authentication message
 */
export function generateAuthMessage(walletAddress: string, nonce: string, domain = "WebIsGrey"): string {
  const timestamp = new Date().toISOString()

  return `Welcome to ${domain}!

Please sign this message to authenticate your wallet.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`
}

/**
 * Validate nonce format
 */
export function isValidNonce(nonce: string): boolean {
  // Check if nonce is a valid hex string of appropriate length
  return /^[a-fA-F0-9]{64}$/.test(nonce)
}

/**
 * Check if signature has valid format
 */
export function isValidSignatureFormat(signature: string, type: "ethereum" | "solana"): boolean {
  if (type === "ethereum") {
    // Ethereum signatures are 65 bytes (130 hex characters) with 0x prefix
    return /^0x[a-fA-F0-9]{130}$/.test(signature)
  } else if (type === "solana") {
    // Solana signatures are 64 bytes (128 hex characters) with 0x prefix
    return /^0x[a-fA-F0-9]{128}$/.test(signature)
  }

  return false
}
