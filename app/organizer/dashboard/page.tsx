"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useWallet } from "@/components/wallet-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import {
  ArrowUpRight,
  Users,
  Ticket,
  DollarSign,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  PlusCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { getEventsByOrganizer, getOrganizerByWalletAddress, getSecondaryTicketSales } from "@/lib/supabase"
import { SecondarySalesHistory } from "@/components/secondary-sales-history"
import { ProtectedRoute } from "@/components/protected-route"

interface EventData {
  id: string
  name: string
  date: string
  time: string
  location: string
  total_tickets: number
  tickets_sold: number
  revenue: number
  event_image_url: string
  category: string
  status: string
}

interface TicketSalesByType {
  name: string
  value: number
}

interface MonthlySales {
  name: string
  value: number
  secondary?: number
}

interface DemographicData {
  age_group: string
  value: number
}

interface SecondaryTicketSale {
  event_id: string
  event_name: string
  ticket_id: string
  original_price: number
  resale_price: number
  sale_date: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

export default function OrganizerDashboard() {
  const router = useRouter()
  const { isConnected, connectWallet, address } = useWallet()
  const [events, setEvents] = useState<EventData[]>([])
  const [ticketSalesByType, setTicketSalesByType] = useState<TicketSalesByType[]>([])
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([])
  const [demographics, setDemographics] = useState<DemographicData[]>([])
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [secondarySales, setSecondarySales] = useState<SecondaryTicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [isRegisteredOrganizer, setIsRegisteredOrganizer] = useState(false)
  const [isCheckingOrganizer, setIsCheckingOrganizer] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [organizer, setOrganizer] = useState<any>(null)

  // Check if the connected wallet is a registered organizer
  const checkOrganizerStatus = useCallback(async (walletAddress: string) => {
    try {
      setIsCheckingOrganizer(true)
      const organizerData = await getOrganizerByWalletAddress(walletAddress)
      setIsRegisteredOrganizer(!!organizerData)
      setOrganizer(organizerData)
    } catch (error) {
      console.error("Error checking organizer status:", error)
      setIsRegisteredOrganizer(false)
    } finally {
      setIsCheckingOrganizer(false)
    }
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!address || !isRegisteredOrganizer) return

    try {
      setLoading(true)
      setRefreshing(true)

      // Fetch events data
      const eventsData = await getEventsByOrganizer(address)

      // Transform events data
      const transformedEvents: EventData[] = eventsData.map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        total_tickets: event.max_tickets || 100,
        tickets_sold: event.tickets_sold || 0,
        revenue: (event.tickets_sold || 0) * (event.ticket_price || 0),
        event_image_url: event.event_image_url,
        category: event.category || "Other",
        status: event.status || "active",
      }))

      setEvents(transformedEvents)

      // Fetch secondary sales data
      const secondarySalesData = await getSecondaryTicketSales(address)
      setSecondarySales(secondarySalesData)

      // Generate ticket sales by type
      const ticketTypeData = transformedEvents.reduce((acc, event) => {
        const category = event.category || "Other"
        const existingCategory = acc.find((item) => item.name === category)

        if (existingCategory) {
          existingCategory.value += event.tickets_sold
        } else {
          acc.push({ name: category, value: event.tickets_sold })
        }

        return acc
      }, [] as TicketSalesByType[])

      setTicketSalesByType(
        ticketTypeData.length > 0
          ? ticketTypeData
          : [
              { name: "Music", value: 35 },
              { name: "Sports", value: 45 },
              { name: "Conference", value: 80 },
              { name: "Festival", value: 25 },
            ],
      )

      // Generate monthly sales data
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()

      // Initialize monthly data for the last 6 months
      const monthlyData: Record<string, { primary: number; secondary: number }> = {}

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentDate.getMonth() - i + 12) % 12
        monthlyData[monthNames[monthIndex]] = { primary: 0, secondary: 0 }
      }

      // Add primary sales data
      transformedEvents.forEach((event) => {
        const eventDate = new Date(event.date)
        const monthName = monthNames[eventDate.getMonth()]

        if (eventDate.getFullYear() === currentYear && monthlyData[monthName]) {
          monthlyData[monthName].primary += event.revenue
        }
      })

      // Add secondary sales data
      secondarySalesData.forEach((sale) => {
        const saleDate = new Date(sale.sale_date)
        const monthName = monthNames[saleDate.getMonth()]

        if (saleDate.getFullYear() === currentYear && monthlyData[monthName]) {
          monthlyData[monthName].secondary += sale.resale_price - sale.original_price
        }
      })

      // Convert to array format for charts
      const monthlySalesData = Object.entries(monthlyData).map(([name, data]) => ({
        name,
        value: data.primary,
        secondary: data.secondary,
      }))

      setMonthlySales(monthlySalesData)

      // Generate sales trend data (weekly)
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(oneWeekAgo.getTime() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]

        // Count tickets sold on this date
        const ticketsSold = transformedEvents.reduce((sum, event) => {
          // This is a simplification - in a real app, you'd have ticket sale dates
          return sum + (event.date === dateStr ? event.tickets_sold / 7 : 0)
        }, 0)

        return {
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          sales: Math.round(ticketsSold),
          date: dateStr,
        }
      })

      setSalesTrend(weeklyTrend)

      // Mock demographic data (in a real app, this would come from your database)
      setDemographics([
        { age_group: "18-24", value: 25 },
        { age_group: "25-34", value: 40 },
        { age_group: "35-44", value: 20 },
        { age_group: "45-54", value: 10 },
        { age_group: "55+", value: 5 },
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [address, isRegisteredOrganizer])

  // Check wallet connection and organizer status
  useEffect(() => {
    if (isConnected && address) {
      checkOrganizerStatus(address)
    } else {
      setIsRegisteredOrganizer(false)
      setIsCheckingOrganizer(false)
    }
  }, [isConnected, address, checkOrganizerStatus])

  // Fetch dashboard data when organizer status is confirmed
  useEffect(() => {
    if (isConnected && address && isRegisteredOrganizer) {
      fetchDashboardData()
    }
  }, [isConnected, address, isRegisteredOrganizer, fetchDashboardData])

  // Calculate summary metrics
  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0)
  const totalTicketsSold = events.reduce((sum, event) => sum + event.tickets_sold, 0)
  const totalEvents = events.length
  const activeEvents = events.filter((event) => event.status === "active").length
  const averageTicketsPerEvent = totalEvents > 0 ? Math.round(totalTicketsSold / totalEvents) : 0

  // Calculate secondary sales metrics
  const totalSecondarySales = secondarySales.length
  const secondaryRevenue = secondarySales.reduce((sum, sale) => sum + (sale.resale_price - sale.original_price), 0)
  const averageResalePrice =
    totalSecondarySales > 0 ? secondarySales.reduce((sum, sale) => sum + sale.resale_price, 0) / totalSecondarySales : 0

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData()
  }

  // If wallet is not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <ProtectedRoute>
        <div className="container py-10">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Organizer Dashboard</CardTitle>
              <CardDescription>Connect your wallet to access the organizer dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You need to connect your wallet to access the organizer dashboard. This allows us to verify your identity
                and show your events.
              </p>
              <Button onClick={connectWallet} className="w-full">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  // If checking organizer status, show loading
  if (isCheckingOrganizer) {
    return (
      <ProtectedRoute>
        <div className="container py-10">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Verifying Organizer Status</CardTitle>
              <CardDescription>Please wait while we verify your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Checking if your wallet is registered as an organizer...
              </p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  // If not a registered organizer, show registration prompt
  if (!isRegisteredOrganizer) {
    return (
      <ProtectedRoute>
        <div className="container py-10">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Organizer Registration Required</CardTitle>
              <CardDescription>Your wallet is not registered as an organizer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Registered</AlertTitle>
                <AlertDescription>
                  The connected wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) is not registered as an organizer
                  in our system.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                To create and manage events, you need to register as an organizer. Registration is a simple process that
                verifies your identity.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push("/organizer/register")}>
                Register as Organizer
              </Button>
            </CardFooter>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  // Loading state
  if (loading && !refreshing) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-10 px-4">
          <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
                <p className="text-muted-foreground">Loading your event performance metrics...</p>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </TabsList>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-80 w-full" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-80 w-full" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
              <p className="text-muted-foreground">View your event performance metrics and analytics</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </>
                )}
              </Button>
              <Link href="/organizer/create-event">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Event
                </Button>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                  <span className="text-emerald-500">+12.5%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTicketsSold}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                  <span className="text-emerald-500">+8.2%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeEvents}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">{totalEvents - activeEvents} past events</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Secondary Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${secondaryRevenue.toFixed(2)}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  <span>{totalSecondarySales} tickets resold</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3 gap-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Sales Trend</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>Weekly ticket sales over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Ticket Sales by Category</CardTitle>
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>Distribution of ticket sales across categories</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketSalesByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {ticketSalesByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Primary vs Secondary Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Primary vs Secondary Sales</CardTitle>
                  <CardDescription>Monthly revenue from primary and secondary sales</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Primary Sales" fill="#8884d8" />
                      <Bar dataKey="secondary" name="Secondary Sales" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>Your most recent events and their performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.length > 0 ? (
                      events.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden">
                              <img
                                src={event.event_image_url || "/placeholder.svg?height=48&width=48"}
                                alt={event.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{event.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()} • {event.time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {event.tickets_sold} / {event.total_tickets}
                              </p>
                              <p className="text-xs text-muted-foreground">Tickets Sold</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${event.revenue.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Revenue</p>
                            </div>
                            <Badge variant={event.status === "active" ? "default" : "secondary"}>
                              {event.status === "active" ? "Active" : "Past"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No events found. Create your first event to get started!</p>
                        <Link href="/organizer/create-event">
                          <Button className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Event
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
                {events.length > 0 && (
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      Showing {Math.min(events.length, 3)} of {events.length} events
                    </p>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Events</h2>
                <Link href="/organizer/create-event">
                  <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Event
                  </Button>
                </Link>
              </div>

              {events.length > 0 ? (
                <>
                  {/* Active Events */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Events</CardTitle>
                      <CardDescription>Events that are currently active or upcoming</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {events
                          .filter((event) => event.status === "active")
                          .map((event) => (
                            <div key={event.id} className="border rounded-lg p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-md overflow-hidden">
                                    <img
                                      src={event.event_image_url || "/placeholder.svg?height=64&width=64"}
                                      alt={event.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold">{event.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(event.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}{" "}
                                      • {event.time}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                                  </div>
                                </div>
                                <div className="mt-2 md:mt-0">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      event.tickets_sold / event.total_tickets > 0.8
                                        ? "bg-green-100 text-green-800"
                                        : event.tickets_sold / event.total_tickets > 0.5
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {Math.round((event.tickets_sold / event.total_tickets) * 100)}% Sold
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-muted/50 p-3 rounded-md">
                                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                                  <p className="text-xl font-semibold">
                                    {event.tickets_sold} / {event.total_tickets}
                                  </p>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div
                                      className="bg-primary h-2.5 rounded-full"
                                      style={{ width: `${(event.tickets_sold / event.total_tickets) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="bg-muted/50 p-3 rounded-md">
                                  <p className="text-sm text-muted-foreground">Revenue</p>
                                  <p className="text-xl font-semibold">${event.revenue.toFixed(2)}</p>
                                </div>

                                <div className="bg-muted/50 p-3 rounded-md">
                                  <p className="text-sm text-muted-foreground">Avg. Ticket Price</p>
                                  <p className="text-xl font-semibold">
                                    ${event.tickets_sold > 0 ? (event.revenue / event.tickets_sold).toFixed(2) : "0.00"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end">
                                <Link href={`/organizer/events/${event.id}`}>
                                  <Button variant="outline" size="sm">
                                    Manage Event
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}

                        {events.filter((event) => event.status === "active").length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">No active events found.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Past Events */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Past Events</CardTitle>
                      <CardDescription>Events that have already taken place</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {events
                          .filter((event) => event.status !== "active")
                          .map((event) => (
                            <div key={event.id} className="border rounded-lg p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-md overflow-hidden">
                                    <img
                                      src={event.event_image_url || "/placeholder.svg?height=64&width=64"}
                                      alt={event.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold">{event.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(event.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}{" "}
                                      • {event.time}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                                  </div>
                                </div>
                                <div className="mt-2 md:mt-0">
                                  <Badge variant="secondary">Past</Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-muted/50 p-3 rounded-md">
                                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                                  <p className="text-xl font-semibold">
                                    {event.tickets_sold} / {event.total_tickets}
                                  </p>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div
                                      className="bg-primary h-2.5 rounded-full"
                                      style={{ width: `${(event.tickets_sold / event.total_tickets) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="bg-muted/50 p-3 rounded-md">
                                  <p className="text-sm text-muted-foreground">Revenue</p>
                                  <p className="text-xl font-semibold">${event.revenue.toFixed(2)}</p>
                                </div>

                                <div className="bg-muted/50 p-3 rounded-md">
                                  <p className="text-sm text-muted-foreground">Avg. Ticket Price</p>
                                  <p className="text-xl font-semibold">
                                    ${event.tickets_sold > 0 ? (event.revenue / event.tickets_sold).toFixed(2) : "0.00"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end">
                                <Link href={`/organizer/events/${event.id}`}>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}

                      {events.filter((event) => event.status !== "active").length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No past events found.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                <p className="text-muted-foreground mb-6">You haven't created any events yet.</p>
                <Link href="/organizer/create-event">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Event
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Monthly Revenue</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Revenue breakdown by month</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Primary Sales" fill="#8884d8">
                        {monthlySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Attendee Demographics</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Age distribution of attendees</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ age_group, percent }) => `${age_group}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {demographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Market Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Secondary Market Analysis</CardTitle>
                <CardDescription>Insights into ticket resales on the secondary market</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-1">Total Resales</h3>
                      <p className="text-2xl font-bold">{totalSecondarySales}</p>
                      <p className="text-sm text-muted-foreground">Tickets resold on secondary market</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-1">Secondary Revenue</h3>
                      <p className="text-2xl font-bold">${secondaryRevenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Revenue from secondary sales</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-1">Avg. Resale Price</h3>
                      <p className="text-2xl font-bold">${averageResalePrice.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Average price of resold tickets</p>
                    </div>
                  </div>

                  {secondarySales.length > 0 ? (
                    <>
                      <Separator />

                      <div>
                        <h3 className="font-medium mb-3">Recent Secondary Sales</h3>
                        <div className="space-y-3">
                          {secondarySales.slice(0, 5).map((sale, index) => (
                            <div key={sale.ticket_id} className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <span className="text-sm font-medium">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{sale.event_name}</p>
                                <div className="flex justify-between">
                                  <p className="text-sm text-muted-foreground">
                                    Original: ${sale.original_price.toFixed(2)}
                                  </p>
                                  <p className="text-sm font-medium">Resold: ${sale.resale_price.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No secondary market data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for your events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-1">Conversion Rate</h3>
                      <p className="text-2xl font-bold">24.8%</p>
                      <p className="text-sm text-muted-foreground">Visitors who purchased tickets</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-1">Avg. Order Value</h3>
                      <p className="text-2xl font-bold">$87.50</p>
                      <p className="text-sm text-muted-foreground">Average spending per order</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-1">Repeat Customers</h3>
                      <p className="text-2xl font-bold">32%</p>
                      <p className="text-sm text-muted-foreground">Customers who attended multiple events</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-3">Top Performing Events</h3>
                    <div className="space-y-3">
                      {events
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 3)
                        .map((event, index) => (
                          <div key={event.id} className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{event.name}</p>
                              <div className="flex justify-between">
                                <p className="text-sm text-muted-foreground">{event.tickets_sold} tickets</p>
                                <p className="text-sm font-medium">${event.revenue.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="mt-6">
          {organizer && organizer.organizer_id && (
            <SecondarySalesHistory organizerId={organizer.organizer_id} limit={5} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
