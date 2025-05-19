"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { magic } from "@/lib/magic"
import { supabase } from "@/lib/supabase"
import { connectMetaMask, connectPhantom, formatWalletAddress } from "@/lib/wallets"
import { useAuth } from "@/components/auth-provider"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<"email" | "metamask" | "phantom">("email")
  const [isMagicReady, setIsMagicReady] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const { refreshUser } = useAuth()

  useEffect(() => {
    if (magic) {
      setIsMagicReady(true)
    }
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isMagicReady) {
      toast({
        title: "Error",
        description: "Authentication service is not ready. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Authenticate with Magic Link
      if (!magic) throw new Error("Magic not initialized")

      const didToken = await magic.auth.loginWithEmailOTP({ email })

      if (!didToken) throw new Error("Authentication failed")

      // Get user info
      const userInfo = await magic.user.getInfo()

      // Check if user exists in database
      const { data, error } = await supabase
        .from("user_data")
        .select("*")
        .eq("wallet_address", userInfo.publicAddress)
        .single()

      if (error || !data) {
        toast({
          title: "Account Not Found",
          description: "No account found with this email. Please sign up first.",
          variant: "destructive",
        })

        // Log out from Magic
        await magic.user.logout()
        return
      }

      // Store user session info in localStorage
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          wallet_address: userInfo.publicAddress,
          wallet_type: "magic",
          username: data.username,
          email: data.email,
          auth_method: "email",
        }),
      )

      // Add this line to refresh the user context
      refreshUser()

      toast({
        title: "Success",
        description: "Signed in successfully!",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Sign in error:", error)
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletSignIn = async (type: "metamask" | "phantom") => {
    setIsLoading(true)
    try {
      let walletData

      if (type === "metamask") {
        walletData = await connectMetaMask()
      } else {
        walletData = await connectPhantom()
      }

      const address = walletData.address
      setWalletAddress(address)

      // Check if wallet exists in database
      const { data, error } = await supabase.from("user_data").select("*").eq("wallet_address", address).single()

      if (error || !data) {
        toast({
          title: "Account Not Found",
          description: "No account found with this wallet. Please sign up first.",
          variant: "destructive",
        })
        return
      }

      // Store user session info in localStorage
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          wallet_address: address,
          wallet_type: type,
          username: data.username,
          email: data.email,
          auth_method: type,
        }),
      )

      // Add this line to refresh the user context
      refreshUser()

      toast({
        title: "Success",
        description: "Signed in successfully with your wallet!",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error(`Error signing in with ${type}:`, error)
      toast({
        title: "Sign In Failed",
        description: `Failed to sign in with ${type === "metamask" ? "MetaMask" : "Phantom"} wallet. ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Sign in to access your wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" onClick={() => setAuthMethod("email")}>
                Email
              </TabsTrigger>
              <TabsTrigger value="metamask" onClick={() => setAuthMethod("metamask")}>
                MetaMask
              </TabsTrigger>
              <TabsTrigger value="phantom" onClick={() => setAuthMethod("phantom")}>
                Phantom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 pt-4">
              <form onSubmit={handleEmailSignIn}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || !isMagicReady}>
                    {isLoading ? "Signing In..." : "Sign In with Email"}
                  </Button>
                  {!isMagicReady && <p className="text-sm text-amber-500">Initializing authentication service...</p>}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="metamask" className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center p-4">
                <div className="rounded-full bg-orange-100 p-3 mb-4">
                  <svg width="40" height="40" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M32.9582 1L19.8241 10.7183L22.2665 5.09986L32.9582 1Z"
                      fill="#E17726"
                      stroke="#E17726"
                      strokeWidth="0.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2.04187 1L15.0446 10.809L12.7336 5.09986L2.04187 1Z"
                      fill="#E27625"
                      stroke="#E27625"
                      strokeWidth="0.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <Button onClick={() => handleWalletSignIn("metamask")} disabled={isLoading} className="w-full">
                  Sign In with MetaMask
                </Button>
                {walletAddress && authMethod === "metamask" && (
                  <p className="mt-2 text-sm text-green-600">Connected: {formatWalletAddress(walletAddress)}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="phantom" className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center p-4">
                <div className="rounded-full bg-purple-100 p-3 mb-4">
                  <svg width="40" height="40" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="128" height="128" rx="64" fill="#AB9FF2" />
                    <path
                      d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.7716 23 15 41.564 15 64.7131C15 87.8621 33.7716 106.627 56.7724 106.627H64.8284C84.8991 106.627 101.163 90.4766 101.163 70.6201C101.163 69.6166 100.36 68.8142 99.3411 68.8142H89.1035C88.0843 68.8142 87.2819 69.6166 87.2819 70.6201C87.2819 82.8556 77.2455 92.8921 64.8284 92.8921H56.7724C41.3411 92.8921 28.9239 80.4749 28.9239 65.0436C28.9239 49.6123 41.3411 37.1952 56.7724 37.1952C72.2037 37.1952 84.6209 49.6123 84.6209 65.0436V70.6201C84.6209 71.6236 85.4232 72.426 86.4425 72.426H110.584C111.603 72.426 112.406 71.6236 112.406 70.6201C112.406 69.6166 111.603 64.9142 110.584 64.9142Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <Button onClick={() => handleWalletSignIn("phantom")} disabled={isLoading} className="w-full">
                  Sign In with Phantom
                </Button>
                {walletAddress && authMethod === "phantom" && (
                  <p className="mt-2 text-sm text-green-600">Connected: {formatWalletAddress(walletAddress)}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
