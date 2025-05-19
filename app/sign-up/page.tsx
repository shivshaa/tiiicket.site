"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserInfoDialog } from "@/components/user-info-dialog"
import { magic } from "@/lib/magic"
import { supabase } from "@/lib/supabase"
import { connectMetaMask, connectPhantom, formatWalletAddress } from "@/lib/wallets"
import { useAuth } from "@/components/auth-provider"

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<"email" | "metamask" | "phantom">("email")
  const [isMagicReady, setIsMagicReady] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletType, setWalletType] = useState("")
  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { refreshUser } = useAuth()

  useEffect(() => {
    if (magic) {
      setIsMagicReady(true)
    }
  }, [])

  // Handle wallet connection
  const handleWalletConnect = async (type: "metamask" | "phantom") => {
    setIsLoading(true)
    try {
      let walletData

      if (type === "metamask") {
        walletData = await connectMetaMask()
      } else {
        walletData = await connectPhantom()
      }

      setWalletAddress(walletData.address)
      setWalletType(walletData.walletType)
      setAuthMethod(type)

      toast({
        title: "Wallet Connected",
        description: `Connected to ${type === "metamask" ? "MetaMask" : "Phantom"} wallet`,
      })

      // Show user info dialog after wallet connection
      setShowUserInfoDialog(true)
    } catch (error) {
      console.error(`Error connecting to ${type}:`, error)
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${type === "metamask" ? "MetaMask" : "Phantom"} wallet. ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle email authentication
  const handleEmailAuth = () => {
    setAuthMethod("email")
    setShowUserInfoDialog(true)
  }

  // Handle user info submission
  const handleUserInfoSubmit = async (username: string, email: string) => {
    setIsLoading(true)
    try {
      if (authMethod === "email") {
        // Email authentication with Magic
        if (!magic) throw new Error("Magic not initialized")

        const didToken = await magic.auth.loginWithEmailOTP({ email })
        if (!didToken) throw new Error("Authentication failed")

        const userInfo = await magic.user.getInfo()
        if (!userInfo || !userInfo.publicAddress) {
          throw new Error("Failed to get wallet information")
        }

        // Store user data in Supabase
        const { error } = await supabase.from("user_data").insert([
          {
            email: email,
            username: username,
            wallet_address: userInfo.publicAddress,
            auth_method: "email",
            auth_provider_id: userInfo.issuer,
            profile_completed: true,
            wallet_source: "system",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) throw error

        // Store session info
        localStorage.setItem(
          "userSession",
          JSON.stringify({
            wallet_address: userInfo.publicAddress,
            wallet_type: "magic",
            username: username,
            email: email,
            auth_method: "email",
          }),
        )

        // Add this line to refresh the user context
        refreshUser()

        toast({
          title: "Success",
          description: "Account created successfully!",
        })
      } else {
        // Wallet authentication (MetaMask or Phantom)
        // Store user data in Supabase
        const { error } = await supabase.from("user_data").insert([
          {
            email: email,
            username: username,
            wallet_address: walletAddress,
            auth_method: authMethod,
            auth_provider_id: walletAddress,
            profile_completed: true,
            wallet_source: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) throw error

        // Store session info
        localStorage.setItem(
          "userSession",
          JSON.stringify({
            wallet_address: walletAddress,
            wallet_type: walletType,
            username: username,
            email: email,
            auth_method: authMethod,
          }),
        )

        // Add this line to refresh the user context
        refreshUser()

        toast({
          title: "Success",
          description: "Account created successfully!",
        })
      }

      // Close dialog and redirect to dashboard
      setShowUserInfoDialog(false)
      router.push("/dashboard")
    } catch (error) {
      console.error("Sign up error:", error)
      toast({
        title: "Error",
        description: "Failed to create your account. Please try again.",
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
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Create an account to get started</CardDescription>
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
              <div className="flex flex-col items-center justify-center p-4">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <p className="text-center mb-4">Sign up with your email address to create a new wallet</p>
                <Button onClick={handleEmailAuth} disabled={isLoading || !isMagicReady} className="w-full">
                  Continue with Email
                </Button>
                {!isMagicReady && <p className="text-sm text-amber-500 mt-2">Initializing authentication service...</p>}
              </div>
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
                    <path
                      d="M28.2435 23.7554L24.7435 29.1057L32.2435 31.1883L34.4059 23.8673L28.2435 23.7554Z"
                      fill="#E27625"
                      stroke="#E27625"
                      strokeWidth="0.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M0.608887 23.8673L2.7599 31.1883L10.2599 29.1057L6.7599 23.7554L0.608887 23.8673Z"
                      fill="#E27625"
                      stroke="#E27625"
                      strokeWidth="0.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-center mb-4">Connect your existing MetaMask wallet to create an account</p>
                <Button onClick={() => handleWalletConnect("metamask")} disabled={isLoading} className="w-full">
                  Connect MetaMask
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
                <p className="text-center mb-4">Connect your existing Phantom wallet to create an account</p>
                <Button onClick={() => handleWalletConnect("phantom")} disabled={isLoading} className="w-full">
                  Connect Phantom
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
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* User Info Dialog */}
      <UserInfoDialog
        isOpen={showUserInfoDialog}
        onClose={() => setShowUserInfoDialog(false)}
        onSubmit={handleUserInfoSubmit}
        title={authMethod === "email" ? "Complete Your Registration" : "Complete Your Wallet Registration"}
        description={
          authMethod === "email"
            ? "Please provide your information to create your account."
            : "Please provide your information to complete your wallet-based registration."
        }
        isWalletFlow={authMethod !== "email"}
        walletAddress={walletAddress}
        isLoading={isLoading}
      />
    </div>
  )
}
