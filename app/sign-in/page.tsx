"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { magic } from "@/lib/magic"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { Loader2, Mail } from "lucide-react"
import WalletAuth from "@/components/walletAuth"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<"email" | "wallet">("wallet")
  const [isMagicReady, setIsMagicReady] = useState(false)
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
      if (!magic) throw new Error("Magic not initialized")

      const didToken = await magic.auth.loginWithEmailOTP({ email })
      if (!didToken) throw new Error("Authentication failed")

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
        await magic.user.logout()
        return
      }

      // Update last login
      await supabase
        .from("user_data")
        .update({ last_login: new Date().toISOString() })
        .eq("wallet_address", userInfo.publicAddress)

      localStorage.setItem(
        "userSession",
        JSON.stringify({
          wallet_address: userInfo.publicAddress,
          wallet_type: "magic",
          email: data.email,
          auth_method: "email",
        }),
      )

      refreshUser()
      toast({
        title: "Success",
        description: "Signed in successfully!",
      })
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

  const handleWalletAuthSuccess = (userData: any) => {
    // Store user session info
    localStorage.setItem(
      "userSession",
      JSON.stringify({
        wallet_address: userData.wallet_address,
        wallet_type: "metamask",
        auth_method: "wallet",
        user_id: userData.id,
      }),
    )

    refreshUser()
    router.push("/dashboard")
  }

  const handleWalletAuthError = (error: string) => {
    toast({
      title: "Authentication Failed",
      description: error,
      variant: "destructive",
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Choose your preferred authentication method</p>
        </div>

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallet" onClick={() => setAuthMethod("wallet")}>
              MetaMask Wallet
            </TabsTrigger>
            <TabsTrigger value="email" onClick={() => setAuthMethod("email")}>
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4 pt-4">
            <WalletAuth onAuthSuccess={handleWalletAuthSuccess} onAuthError={handleWalletAuthError} />
          </TabsContent>

          <TabsContent value="email" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Authentication
                </CardTitle>
                <CardDescription>Sign in with your email address using Magic Link</CardDescription>
              </CardHeader>
              <CardContent>
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
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In with Email"
                      )}
                    </Button>
                    {!isMagicReady && (
                      <Alert>
                        <AlertDescription>Initializing authentication service...</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Secure authentication using cryptographic signatures</div>
          <div className="text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
