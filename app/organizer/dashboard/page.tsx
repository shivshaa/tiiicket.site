"use client"

import { CardFooter } from "@/components/ui/card"

import { Checkbox } from "@/components/ui/checkbox"

import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Calendar, DollarSign, Ticket, PlusCircle, LayoutDashboard, Settings, FileText } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function OrganizerDashboard() {
  const { isConnected, connectWallet } = useWallet()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  // In a real app, this would be fetched from an API
  const events = [
    {
      id: "1",
      title: "Summer Music Festival",
      date: "2023-07-15",
      soldTickets: 243,
      totalTickets: 620,
      revenue: "12.15 ETH",
      status: "Active",
    },
    {
      id: "2",
      title: "Tech Conference 2023",
      date: "2023-08-10",
      soldTickets: 156,
      totalTickets: 300,
      revenue: "12.48 ETH",
      status: "Active",
    },
    {
      id: "3",
      title: "Art Exhibition Opening",
      date: "2023-06-25",
      soldTickets: 89,
      totalTickets: 100,
      revenue: "2.67 ETH",
      status: "Completed",
    },
  ]

  const transactions = [
    {
      id: "tx1",
      event: "Summer Music Festival",
      buyer: "0x1a2...3b4c",
      amount: "0.05 ETH",
      ticketType: "General Admission",
      date: "2023-06-10",
      type: "Primary",
    },
    {
      id: "tx2",
      event: "Summer Music Festival",
      buyer: "0x4d5...6e7f",
      amount: "0.15 ETH",
      ticketType: "VIP Access",
      date: "2023-06-09",
      type: "Primary",
    },
    {
      id: "tx3",
      event: "Tech Conference 2023",
      buyer: "0x8g9...0h1i",
      amount: "0.08 ETH",
      ticketType: "General Admission",
      date: "2023-06-08",
      type: "Primary",
    },
    {
      id: "tx4",
      event: "Summer Music Festival",
      buyer: "0x2j3...4k5l",
      amount: "0.06 ETH",
      ticketType: "General Admission",
      date: "2023-06-07",
      type: "Secondary",
    },
    {
      id: "tx5",
      event: "Art Exhibition Opening",
      buyer: "0x6m7...8n9o",
      amount: "0.03 ETH",
      ticketType: "General Admission",
      date: "2023-06-05",
      type: "Primary",
    },
  ]

  if (!isConnected) {
    return (
      <div className="container py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Organizer Dashboard</CardTitle>
            <CardDescription>Connect your wallet to access the organizer dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and track ticket sales</p>
          </div>
          <Link href="/organizer/create-event">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Event
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">27.3 ETH</div>
              <p className="text-xs text-muted-foreground">+2.5 ETH from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">488</div>
              <p className="text-xs text-muted-foreground">+120 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">1 upcoming event</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secondary Sales</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8 ETH</div>
              <p className="text-xs text-muted-foreground">+0.4 ETH from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="overview">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <FileText className="mr-2 h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold">Event Performance</h2>
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>{event.title}</CardTitle>
                      <Badge variant={event.status === "Active" ? "default" : "secondary"}>{event.status}</Badge>
                    </div>
                    <CardDescription>{new Date(event.date).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Ticket Sales</span>
                          <span>
                            {event.soldTickets} / {event.totalTickets}
                          </span>
                        </div>
                        <Progress value={(event.soldTickets / event.totalTickets) * 100} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-medium">{event.revenue}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Events</h2>
              <Link href="/organizer/create-event">
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Event
                </Button>
              </Link>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tickets Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === "Active" ? "default" : "secondary"}>{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {event.soldTickets} / {event.totalTickets}
                      </TableCell>
                      <TableCell>{event.revenue}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/organizer/events/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.event}</TableCell>
                      <TableCell>{tx.buyer}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === "Primary" ? "default" : "outline"}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell>{tx.ticketType}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold">Organizer Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your organizer profile and payment settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Organization Name</h3>
                  <Input placeholder="Your organization name" defaultValue="NYC Events Co." />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Contact Email</h3>
                  <Input placeholder="Your contact email" defaultValue="contact@nycevents.co" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Payout Wallet Address</h3>
                  <Input
                    placeholder="Your Ethereum wallet address"
                    defaultValue="0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Secondary Market Settings</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="royalties" defaultChecked />
                    <label htmlFor="royalties" className="text-sm">
                      Enable royalties on secondary sales (10%)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="price-cap" defaultChecked />
                    <label htmlFor="price-cap" className="text-sm">
                      Enable price cap on resale (max 50% above original price)
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

