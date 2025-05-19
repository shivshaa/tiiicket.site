"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface SecondarySale {
  sale_id: string
  token_id: number
  event_id: string
  seller_address: string
  buyer_address: string | null
  original_price: number
  resale_price: number
  status: "pending" | "in_progress" | "completed" | "cancelled" | "failed"
  sale_date: string
  event_name?: string
}

interface SecondarySalesHistoryProps {
  organizerId: string
  limit?: number
  showAll?: boolean
}

export function SecondarySalesHistory({ organizerId, limit = 10, showAll = false }: SecondarySalesHistoryProps) {
  const [sales, setSales] = useState<SecondarySale[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalSales, setTotalSales] = useState(0)

  useEffect(() => {
    const fetchSecondarySales = async () => {
      try {
        setLoading(true)

        // In a real implementation, we would filter by organizer_id
        // For now, we'll fetch all sales and filter on the client side
        const { data, error } = await supabase
          .from("secondary_sales")
          .select(`
            *,
            event_data:event_id (
              name,
              organizer_id
            )
          `)
          .order("sale_date", { ascending: false })
          .limit(showAll ? 100 : limit)

        if (error) {
          throw error
        }

        // Filter sales for this organizer
        const filteredSales = data
          .filter((sale) => sale.event_data?.organizer_id === organizerId)
          .map((sale) => ({
            ...sale,
            event_name: sale.event_data?.name || "Unknown Event",
          }))

        setSales(filteredSales)

        // Calculate statistics
        const completedSales = filteredSales.filter((sale) => sale.status === "completed")
        setTotalSales(completedSales.length)

        // Calculate revenue (assuming 2.5% platform fee)
        const revenue = completedSales.reduce((sum, sale) => {
          const fee = sale.resale_price * 0.025
          return sum + fee
        }, 0)
        setTotalRevenue(revenue)
      } catch (error) {
        console.error("Error fetching secondary sales:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSecondarySales()

    // Set up real-time subscription
    const channel = supabase
      .channel("secondary-sales-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "secondary_sales",
        },
        () => {
          fetchSecondarySales()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [organizerId, limit, showAll])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Secondary Sales</CardTitle>
        <CardDescription>Track tickets resold by fans and your revenue from platform fees</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Secondary Sales</p>
            <p className="text-2xl font-bold">{totalSales}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Revenue from Fees (2.5%)</p>
            <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        ) : sales.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Resale Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.sale_id}>
                  <TableCell className="font-medium">{sale.event_name}</TableCell>
                  <TableCell>#{sale.token_id}</TableCell>
                  <TableCell>₹{sale.original_price.toLocaleString()}</TableCell>
                  <TableCell>
                    ₹{sale.resale_price.toLocaleString()}
                    <div className="text-xs text-muted-foreground">
                      Fee: ₹{(sale.resale_price * 0.025).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No secondary sales found for your events.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
