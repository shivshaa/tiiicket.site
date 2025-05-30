import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/runtime.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const { wallet_address } = await req.json()

    if (!wallet_address) {
      return new Response(JSON.stringify({ error: "Wallet address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validate Ethereum address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!addressRegex.test(wallet_address)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const normalizedAddress = wallet_address.toLowerCase()

    // Generate a cryptographically secure nonce
    const nonceBytes = new Uint8Array(32)
    crypto.getRandomValues(nonceBytes)
    const nonce = Array.from(nonceBytes, (byte) => byte.toString(16).padStart(2, "0")).join("")

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Clean up expired nonces for this wallet
    await supabaseClient
      .from("auth_nonces")
      .delete()
      .eq("wallet_address", normalizedAddress)
      .lt("expires_at", new Date().toISOString())

    // Insert new nonce
    const { data, error } = await supabaseClient
      .from("auth_nonces")
      .insert({
        wallet_address: normalizedAddress,
        nonce: nonce,
        expires_at: expiresAt,
        used: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return new Response(JSON.stringify({ error: "Failed to generate nonce" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        nonce: nonce,
        expires_at: expiresAt,
        message: `Welcome to WebIsGrey!

Please sign this message to authenticate your wallet.

Wallet: ${normalizedAddress}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in generate-nonce function:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
