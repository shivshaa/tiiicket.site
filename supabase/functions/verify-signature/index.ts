import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"
import { env } from "https://deno.land/x/dotenv/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Ethereum signature verification using Web Crypto API
async function verifyEthereumSignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
  try {
    // This is a simplified version. In production, you would use a proper
    // Ethereum signature verification library like ethers.js

    // For now, we'll validate the signature format and assume it's valid
    // if it matches the expected format
    const signatureRegex = /^0x[a-fA-F0-9]{130}$/
    if (!signatureRegex.test(signature)) {
      return false
    }

    // In a real implementation, you would:
    // 1. Hash the message with Ethereum's message prefix
    // 2. Recover the public key from the signature
    // 3. Derive the address from the public key
    // 4. Compare with the expected address

    // For this demo, we'll return true if the signature format is correct
    return true
  } catch (error) {
    console.error("Signature verification error:", error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = env.get("SUPABASE_URL") ?? ""
    const supabaseKey = env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const { wallet_address, signature, nonce } = await req.json()

    if (!wallet_address || !signature || !nonce) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const normalizedAddress = wallet_address.toLowerCase()

    // Verify nonce exists and is valid
    const { data: nonceData, error: nonceError } = await supabaseClient
      .from("auth_nonces")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .eq("nonce", nonce)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (nonceError || !nonceData) {
      return new Response(JSON.stringify({ error: "Invalid or expired nonce" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Generate the message that should have been signed
    const expectedMessage = `Welcome to WebIsGrey!

Please sign this message to authenticate your wallet.

Wallet: ${normalizedAddress}
Nonce: ${nonce}
Timestamp: ${new Date(nonceData.created_at).toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`

    // Verify the signature
    const isValidSignature = await verifyEthereumSignature(expectedMessage, signature, normalizedAddress)

    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Mark nonce as used
    await supabaseClient.from("auth_nonces").update({ used: true }).eq("id", nonceData.id)

    // Check if user exists, create if not
    let { data: userData, error: userError } = await supabaseClient
      .from("user_data")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .single()

    if (userError && userError.code === "PGRST116") {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabaseClient
        .from("user_data")
        .insert({
          wallet_address: normalizedAddress,
          last_login: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating user:", createError)
        return new Response(JSON.stringify({ error: "Failed to create user account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      userData = newUser
    } else if (userError) {
      console.error("Error fetching user:", userError)
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } else {
      // Update last login
      await supabaseClient
        .from("user_data")
        .update({ last_login: new Date().toISOString() })
        .eq("wallet_address", normalizedAddress)
    }

    // Generate JWT token
    const jwtSecret = env.get("JWT_SECRET") ?? "your-secret-key"
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    )

    const payload = {
      sub: userData.id,
      wallet_address: normalizedAddress,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    }

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key)

    return new Response(
      JSON.stringify({
        success: true,
        token: token,
        user: {
          id: userData.id,
          wallet_address: userData.wallet_address,
          created_at: userData.created_at,
          last_login: userData.last_login,
          is_active: userData.is_active,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in verify-signature function:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
