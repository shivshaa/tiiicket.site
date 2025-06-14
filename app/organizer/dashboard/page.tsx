"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { useWallet } from "@/components/wallet-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  AreaChart,
  Area,
  ReferenceLine,
  Label,
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
  UserCheck,
} from "lucide-react"
import { getOrganizerByWalletAddress } from "@/lib/supabase"

interface EventData {
  id: string
  name: string
  date: string
  time: string
  location: string
  total_tickets: number
  tickets_sold: number
  tickets_scanned: number
  revenue: number
  event_image_url: string
  category: string
  status: string
  ticket_categories: {
    name: string
    sold: number
    total: number
    price: number
  }[]
}

interface TicketSalesByType {
  name: string
  value: number
  color: string
}

interface TicketSalesByCategory {
  name: string
  value: number
  color: string
}

interface MonthlySales {
  name: string
  primary: number
  secondary: number
}

interface EventSalesTrend {
  date: string
  [key: string]: string | number
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

interface AttendanceData {
  event_name: string
  sold: number
  scanned: number
  attendance_rate: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]
const CATEGORY_COLORS = {
  General: "#4CAF50",
  Standard: "#2196F3",
  Elite: "#9C27B0",
  VIP: "#F44336",
  Corporate: "#FF9800",
}

export default function OrganizerDashboard() {
  const router = useRouter()
  const { isConnected, connectWallet, address } = useWallet()
  const [events, setEvents] = useState<EventData[]>([])
  const [ticketSalesByType, setTicketSalesByType] = useState<TicketSalesByType[]>([])
  const [ticketSalesByCategory, setTicketSalesByCategory] = useState<TicketSalesByCategory[]>([])
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([])
  const [eventSalesTrend, setEventSalesTrend] = useState<EventSalesTrend[]>([])
  const [demographics, setDemographics] = useState<DemographicData[]>([])
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [secondarySales, setSecondarySales] = useState<SecondaryTicketSale[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
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

  // Generate mock data for ticket categories
  const generateTicketCategories = () => {
    const categories = ["General", "Standard", "Elite", "VIP", "Corporate"]
    return categories.map((cat) => {
      const total = Math.floor(Math.random() * 100) + 50
      const sold = Math.floor(Math.random() * total)
      return {
        name: cat,
        sold,
        total,
        price: cat === "General" ? 50 : cat === "Standard" ? 100 : cat === "Elite" ? 200 : cat === "VIP" ? 350 : 500,
      }
    })
  }

  // Generate mock events with more detailed data
  const generateMockEvents = () => {
    const eventNames = [
      "Mumbai vs Gujarat",
      "Chennai vs Delhi",
      "Bengaluru vs Kolkata",
      "Lucknow vs Rajasthan",
      "Hyderabad vs Punjab",
      "Delhi vs Bengaluru",
      "Kolkata vs Chennai",
    ]

    const locations = [
      "Wankhede Stadium, Mumbai",
      "MA Chidambaram Stadium, Chennai",
      "Chinnswamy Stadium, Bengaluru",
      "Ekna Cricket Stadium, Lucknow",
      "Rajiv Gandhi Stadium, Hyderabad",
      "Arun Jaitley Stadium, New Delhi",
      "Eden Gardens, Kolkata",
    ]

    const categories = ["Sports", "Music", "Conference", "Festival"]
    const statuses = ["active", "completed", "upcoming"]

    const today = new Date()

    return eventNames.map((name, index) => {
      const eventDate = new Date()
      eventDate.setDate(today.getDate() + (index % 3 === 0 ? -10 : index % 3 === 1 ? 15 : 5))

      const total_tickets = Math.floor(Math.random() * 1000) + 500
      const tickets_sold = Math.floor(Math.random() * total_tickets)
      const tickets_scanned = Math.floor(Math.random() * tickets_sold)

      return {
        id: `event-${index + 1}`,
        name,
        date: eventDate.toISOString().split("T")[0],
        time: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? "30" : "00"} ${Math.random() > 0.5 ? "PM" : "AM"}`,
        location: locations[index % locations.length],
        total_tickets,
        tickets_sold,
        tickets_scanned,
        revenue: tickets_sold * (Math.floor(Math.random() * 100) + 50),
        event_image_url: `/placeholder.svg?height=100&width=100&text=${encodeURIComponent(name)}`,
        category: categories[index % categories.length],
        status: statuses[index % statuses.length],
        ticket_categories: generateTicketCategories(),
      }
    })
  }

  // Generate mock data for event sales trend
  const generateEventSalesTrend = (events: EventData[]) => {
    const dates = []
    const today = new Date()

    // Generate dates for the last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      dates.push(date.toISOString().split("T")[0])
    }

    // Create data points for each date with sales for each event
    return dates.map((date) => {
      const dataPoint: EventSalesTrend = { date }

      events.forEach((event) => {
        // Only include active events in the trend
        if (event.status === "active" || event.status === "upcoming") {
          const eventDate = new Date(event.date)
          const currentDate = new Date(date)

          // Only show sales for dates before the event date
          if (currentDate <= eventDate) {
            // Generate a random number of tickets sold on this date
            // More tickets tend to be sold closer to the event date
            const daysUntilEvent = Math.max(
              1,
              Math.floor((eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
            )
            const salesFactor = 1 / (daysUntilEvent * 0.1)
            const dailySales = Math.floor(Math.random() * 20 * salesFactor)

            dataPoint[event.name] = dailySales
          }
        }
      })

      return dataPoint
    })
  }

  // Generate mock data for ticket sales by category
  const generateTicketSalesByCategory = (events: EventData[]) => {
    const categoryTotals: Record<string, number> = {}

    events.forEach((event) => {
      event.ticket_categories.forEach((category) => {
        if (categoryTotals[category.name]) {
          categoryTotals[category.name] += category.sold
        } else {
          categoryTotals[category.name] = category.sold
        }
      })
    })

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || "#999999",
    }))
  }

  // Generate mock data for monthly sales
  const generateMonthlySales = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()

    // Generate data for the last 6 months
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - i + 12) % 12
      const isPastMonth = i > 0

      // Generate more realistic data with trends
      // Primary sales are higher in recent months
      // Secondary sales increase as a percentage of primary sales over time
      const primaryBase = 10000 - i * 1000
      const primaryRandom = Math.floor(Math.random() * 2000) - 1000
      const primary = Math.max(0, primaryBase + primaryRandom)

      // Secondary sales are a percentage of primary sales, increasing for older months
      const secondaryPercentage = 0.1 + i * 0.05
      const secondaryBase = primary * secondaryPercentage
      const secondaryRandom = Math.floor(Math.random() * 500) - 250
      const secondary = Math.max(0, secondaryBase + secondaryRandom)

      return {
        name: monthNames[monthIndex],
        primary: isPastMonth ? primary : currentDate.getDate() < 15 ? primary * 0.5 : primary * 0.8,
        secondary: isPastMonth ? secondary : currentDate.getDate() < 15 ? secondary * 0.3 : secondary * 0.6,
      }
    }).reverse()
  }

  // Generate mock data for attendance
  const generateAttendanceData = (events: EventData[]) => {
    return events
      .filter((event) => event.status === "completed")
      .map((event) => ({
        event_name: event.name,
        sold: event.sold,
        scanned: event.scanned,
        attendance_rate: event.tickets_scanned / event.tickets_sold,
      }))
  }

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!address || !isRegisteredOrganizer) return

    try {
      setLoading(true)
      setRefreshing(true)

      // In a real app, we would fetch real data from the database
      // For now, we'll use mock data for demonstration

      // Generate mock events
      const mockEvents = generateMockEvents()
      setEvents(mockEvents)

      // Generate event sales trend
      const mockEventSalesTrend = generateEventSalesTrend(mockEvents)
      setEventSalesTrend(mockEventSalesTrend)

      // Generate ticket sales by category
      const mockTicketSalesByCategory = generateTicketSalesByCategory(mockEvents)
      setTicketSalesByCategory(mockTicketSalesByCategory)

      // Generate monthly sales data
      const mockMonthlySales = generateMonthlySales()
      setMonthlySales(mockMonthlySales)

      // Generate attendance data
      const mockAttendanceData = generateAttendanceData(mockEvents)
      setAttendanceData(mockAttendanceData)

      // Generate ticket sales by type (category)
      const ticketTypeData = mockEvents.reduce((acc, event) => {
        const category = event.category || "Other"
        const existingCategory = acc.find((item) => item.name === category)

        if (existingCategory) {
          existingCategory.value += event.tickets_sold
        } else {
          acc.push({
            name: category,
            value: event.tickets_sold,
            color: COLORS[acc.length % COLORS.length],
          })
        }

        return acc
      }, [] as TicketSalesByType[])

      setTicketSalesByType(ticketTypeData)

      // Generate sales trend data (weekly)
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(oneWeekAgo.getTime() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]

        // Count tickets sold on this date
        const ticketsSold = mockEvents.reduce((sum, event) => {
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

      // Mock demographic data
      setDemographics([
        { age_group: "18-24", value: 25 },
        { age_group: "25-34", value: 40 },
        { age_group: "35-44", value: 20 },
        { age_group: "45-54", value: 10 },
        { age_group: "55+", value: 5 },
      ])

      // Mock secondary sales data
      const mockSecondarySales = mockEvents.flatMap((event) => {
        const numSales = Math.floor(Math.random() * 5) + 1
        return Array.from({ length: numSales }, (_, i) => {
          const originalPrice = Math.floor(Math.random() * 100) + 50
          const resalePrice = originalPrice * (1 + Math.random() * 0.5)
          const saleDate = new Date()
          saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30))

          return {
            event_id: event.id,
            event_name: event.name,
            ticket_id: `ticket-${event.id}-${i}`,
            original_price: originalPrice,
            resale_price: resalePrice,
            sale_date: saleDate.toISOString(),
          }
        })
      })

      setSecondarySales(mockSecondarySales)
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

  // Calculate attendance metrics
  const totalAttendance =
    attendanceData.length > 0
      ? (attendanceData.reduce((sum, event) => sum + event.scanned, 0) /
          attendanceData.reduce((sum, event) => sum + event.sold, 0)) *
        100
      : 0

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
                You need to connect your wallet to access the organizer dashboard. This allows us to verify your
                identity and show your events.
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
                <CardTitle className="text-sm font-medium">Fan Attendance</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAttendance.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${totalAttendance}%` }}></div>
                </div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  <span>Based on {attendanceData.length} completed events</span>
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
              {/* Sales Trend Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sales Trend by Event</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Daily ticket sales for each event over the last 14 days</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eventSalesTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                          const d = new Date(date)
                          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [`${value} tickets`, name]}
                        labelFormatter={(label) => {
                          const d = new Date(label)
                          return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                        }}
                      />
                      <Legend />
                      {events
                        .filter((event) => event.status === "active" || event.status === "upcoming")
                        .slice(0, 5) // Limit to 5 events for clarity
                        .map((event, index) => (
                          <Line
                            key={event.id}
                            type="monotone"
                            dataKey={event.name}
                            stroke={COLORS[index % COLORS.length]}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ticket Sales by Category */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Ticket Sales by Category</CardTitle>
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Distribution of ticket sales across different ticket categories</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketSalesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ticketSalesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tickets`, "Sold"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

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
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]}
                        itemSorter={(item) => -item.value}
                      />
                      <Legend />
                      <Bar dataKey="primary" name="Primary Sales" fill="#8884d8" />
                      <Bar dataKey="secondary" name="Secondary Sales" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Fan Attendance Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Fan Attendance Rate</CardTitle>
                  <CardDescription>Percentage of sold tickets that were scanned at events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall attendance rate */}
                    <div className="bg-muted/50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Overall Attendance Rate</h3>
                        <span className="text-sm font-medium">{totalAttendance.toFixed(1)}%</span>
                      </div>
                      <Progress value={totalAttendance} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Based on {attendanceData.reduce((sum, event) => sum + event.scanned, 0)} scanned tickets out of{" "}
                        {attendanceData.reduce((sum, event) => sum + event.sold, 0)} sold
                      </p>
                    </div>

                    {/* Individual event attendance rates */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Attendance by Event</h3>
                      {attendanceData.map((event, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{event.event_name}</span>
                            <span className="text-sm font-medium">{(event.attendance_rate * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={event.attendance_rate * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {event.scanned} scanned / {event.sold} sold
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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
                            <Badge
                              variant={
                                event.status === "active"
                                  ? "default"
                                  : event.status === "upcoming"
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              {event.status === "active" ? "Active" : event.status === "upcoming" ? "Upcoming" : "Past"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No events found. Create your first event to get started!
                        </p>
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
                          .filter((event) => event.status === "active" || event.status === "upcoming")
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

                              {/* Ticket Categories */}
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Ticket Categories</h4>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                  {event.ticket_categories.map((category, index) => (
                                    <div key={index} className="border rounded p-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium">{category.name}</span>
                                        <span className="text-xs">${category.price}</span>
                                      </div>
                                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="h-1.5 rounded-full"
                                          style={{
                                            width: `${(category.sold / category.total) * 100}%`,
                                            backgroundColor:
                                              CATEGORY_COLORS[category.name as keyof typeof CATEGORY_COLORS] ||
                                              "#999999",
                                          }}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-muted-foreground">{category.sold} sold</span>
                                        <span className="text-xs text-muted-foreground">
                                          {category.total - category.sold} left
                                        </span>
                                      </div>
                                    </div>
                                  ))}
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

                        {events.filter((event) => event.status === "active" || event.status === "upcoming").length ===
                          0 && (
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
                          .filter((event) => event.status === "completed")
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
                                  <Badge variant="secondary">Completed</Badge>
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
                                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                  <p className="text-xl font-semibold">
                                    {((event.tickets_scanned / event.tickets_sold) * 100).toFixed(1)}%
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {event.tickets_scanned} scanned
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {event.tickets_sold - event.tickets_scanned} no-shows
                                    </span>
                                  </div>
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

                        {events.filter((event) => event.status === "completed").length === 0 && (
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
                      <AreaChart data={monthlySales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Revenue"]} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="primary"
                          name="Primary Sales"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                        />
                        <Area
                          type="monotone"
                          dataKey="secondary"
                          name="Secondary Sales"
                          stackId="1"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                        />
                      </AreaChart>
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

              {/* Fan Attendance Rate Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Fan Attendance Analysis</CardTitle>
                  <CardDescription>Detailed analysis of fan attendance rates across events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Attendance Rate by Event */}
                      <div>
                        <h3 className="font-medium mb-4">Attendance Rate by Event</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={attendanceData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                              <YAxis type="category" dataKey="event_name" width={150} />
                              <Tooltip
                                formatter={(value) => [`${value.toFixed(1)}%`, "Attendance Rate"]}
                                labelFormatter={(label) => `Event: ${label}`}
                              />
                              <Legend />
                              <Bar
                                dataKey={(entry) => entry.attendance_rate * 100}
                                name="Attendance Rate"
                                fill="#8884d8"
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Attendance vs No-Shows */}
                      <div>
                        <h3 className="font-medium mb-4">Attendance vs No-Shows</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="event_name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="scanned" name="Attended" fill="#4CAF50" stackId="a" />
                              <Bar
                                dataKey={(entry) => entry.sold - entry.scanned}
                                name="No-Shows"
                                fill="#FF5722"
                                stackId="a"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Metrics */}
                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="font-medium mb-3">Attendance Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Average Attendance Rate</p>
                          <p className="text-2xl font-bold">{totalAttendance.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Attendees</p>
                          <p className="text-2xl font-bold">
                            {attendanceData.reduce((sum, event) => sum + event.scanned, 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total No-Shows</p>
                          <p className="text-2xl font-bold">
                            {attendanceData.reduce((sum, event) => sum + (event.sold - event.scanned), 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Trend */}
                    <div>
                      <h3 className="font-medium mb-3">Attendance Rate Trend</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Attendance rates for completed events over time
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={attendanceData.map((event, index) => ({
                              ...event,
                              index: index + 1,
                              rate: event.attendance_rate * 100,
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="index"
                              label={{ value: "Event Number", position: "insideBottom", offset: -5 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              label={{ value: "Attendance Rate (%)", angle: -90, position: "insideLeft" }}
                            />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "Attendance Rate"]} />
                            <Line
                              type="monotone"
                              dataKey="rate"
                              name="Attendance Rate"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                            <ReferenceLine y={totalAttendance} stroke="red" strokeDasharray="3 3">
                              <Label value="Average" position="right" />
                            </ReferenceLine>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
