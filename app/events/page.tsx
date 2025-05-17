import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Filter } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EventsPage() {
  // In a real app, this data would come from an API
  const events = [
    {
      id: "1",
      title: "Summer Music Festival",
      description: "A three-day music festival featuring top artists from around the world.",
      date: "2023-07-15",
      time: "12:00 PM",
      location: "Central Park, New York",
      image: "/placeholder.svg?height=400&width=600",
      price: "0.05 ETH",
      category: "Music",
    },
    {
      id: "2",
      title: "Tech Conference 2023",
      description: "The biggest tech conference of the year with keynotes from industry leaders.",
      date: "2023-08-10",
      time: "9:00 AM",
      location: "Convention Center, San Francisco",
      image: "/placeholder.svg?height=400&width=600",
      price: "0.08 ETH",
      category: "Conference",
    },
    {
      id: "3",
      title: "Art Exhibition Opening",
      description: "Exclusive opening night for the new contemporary art exhibition.",
      date: "2023-06-25",
      time: "7:00 PM",
      location: "Modern Art Gallery, London",
      image: "/placeholder.svg?height=400&width=600",
      price: "0.03 ETH",
      category: "Art",
    },
    {
      id: "4",
      title: "Comedy Night Special",
      description: "An evening of laughter with the best stand-up comedians in town.",
      date: "2023-07-05",
      time: "8:00 PM",
      location: "Laugh Factory, Los Angeles",
      image: "/placeholder.svg?height=400&width=600",
      price: "0.02 ETH",
      category: "Entertainment",
    },
    {
      id: "5",
      title: "Blockchain Summit",
      description: "Connect with blockchain experts and enthusiasts from around the globe.",
      date: "2023-09-12",
      time: "10:00 AM",
      location: "Crypto Center, Miami",
      image: "/placeholder.svg?height=400&width=600",
      price: "0.1 ETH",
      category: "Conference",
    },
    {
      id: "6",
      title: "Sports Championship Finals",
      description: "The ultimate showdown to crown this year's champions.",
      date: "2023-08-20",
      time: "3:00 PM",
      location: "National Stadium, Chicago",
      image: "/placeholder.svg?height=400&width=600",
      price: "0.07 ETH",
      category: "Sports",
    },
  ]

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Browse and purchase tickets for upcoming events.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input placeholder="Search events..." className="w-full" />
          </div>
          <div className="w-full md:w-[180px]">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[180px]">
            <Select defaultValue="upcoming">
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={event.image || "/placeholder.svg"}
                  alt={event.title}
                  className="object-cover w-full h-full transition-transform hover:scale-105"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{event.title}</CardTitle>
                  <Badge>{event.category}</Badge>
                </div>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 opacity-70" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 opacity-70" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 opacity-70" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center font-bold mt-2">Price: {event.price}</div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button className="w-full">View Event</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

