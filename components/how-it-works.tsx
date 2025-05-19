"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Ticket, QrCode, Calendar } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      icon: <Wallet className="h-10 w-10 text-primary" />,
      title: "Connect Your Wallet",
      description: "Link your digital wallet to securely purchase and store your NFT tickets.",
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Browse Events",
      description: "Explore upcoming events and select the ones you want to attend.",
    },
    {
      icon: <Ticket className="h-10 w-10 text-primary" />,
      title: "Purchase Tickets",
      description: "Buy your tickets securely with no hidden fees.",
    },
    {
      icon: <QrCode className="h-10 w-10 text-primary" />,
      title: "Attend Event",
      description: "Show your digital ticket QR code at the venue for seamless entry.",
    },
    {
      icon: <Ticket className="h-10 w-10 text-primary" />,
      title: "Resale Tickets",
      description: "Can't make to the event? Put your ticket for resale on the marketplace.",
    },
  ]

  return (
    <section className="py-16 bg-gradient-to-b from-orange via-blue-900 to-muted/40 text-white overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center mb-12 text-center">
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-[800px]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our blockchain-powered ticketing platform makes attending events simple, secure, and transparent
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="h-full border-primary/10 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center text-center p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
