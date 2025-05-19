"use client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Ticket, Calendar, User, CreditCard } from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.username || "User"}!</h1>
              <p className="text-muted-foreground">Manage your tickets and account settings</p>
            </div>
          </div>

          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3 gap-4">
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
              <TabsTrigger value="events">Upcoming Events</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Tickets</CardTitle>
                  <CardDescription>View and manage your purchased tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Ticket className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Tickets Found</h3>
                    <p className="text-muted-foreground mb-6">You haven't purchased any tickets yet.</p>
                    <Button onClick={() => router.push("/events")}>Browse Events</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Events you might be interested in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Discover Events</h3>
                    <p className="text-muted-foreground mb-6">Find exciting events happening near you.</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="outline" onClick={() => router.push("/music")}>
                        Music Events
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/sports")}>
                        Sports Events
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/market")}>
                        Ticket Marketplace
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Account Information</h3>
                        <p className="text-sm text-muted-foreground">Username: {user?.username}</p>
                        <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push("/profile")}>
                        Edit Profile
                      </Button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Wallet</h3>
                        <p className="text-sm text-muted-foreground">
                          Connected:{" "}
                          {user?.wallet_address
                            ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
                            : "None"}
                        </p>
                        <p className="text-sm text-muted-foreground">Type: {user?.wallet_type || "None"}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push("/profile")}>
                        Manage Wallet
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    Your account is secured with {user?.auth_method === "email" ? "Magic Link" : user?.auth_method}{" "}
                    authentication.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
