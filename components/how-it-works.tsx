import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, Wallet, RefreshCw, QrCode } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              WebIsGrey uses blockchain technology to create a secure and transparent ticketing experience.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 pt-8">
          <Card>
            <CardHeader className="pb-2">
              <Wallet className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>Connect your Ethereum wallet to access the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We support MetaMask and other popular Ethereum wallets for a seamless experience.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Ticket className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Purchase Tickets</CardTitle>
              <CardDescription>Buy NFT tickets directly from event organizers.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Each ticket is a unique NFT stored on the blockchain, providing proof of authenticity.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <RefreshCw className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Trade Securely</CardTitle>
              <CardDescription>Resell or transfer tickets on our secondary marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Smart contracts ensure fair pricing and that royalties go back to event organizers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <QrCode className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Attend Events</CardTitle>
              <CardDescription>Use your NFT ticket to gain entry to events.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Present your digital ticket via QR code for seamless verification at the venue.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

