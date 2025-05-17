"use client"

import { Button } from "@/components/ui/button"
import { TrendingEvents } from "@/components/trending-events"
import { HowItWorks } from "@/components/how-it-works"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <motion.h1
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                The Future of Event Ticketing
              </motion.h1>
              <motion.p
                className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Secure, transparent, and verifiable tickets powered by blockchain technology. Buy, sell, and trade with
                confidence.
              </motion.p>
            </div>
            <motion.div
              className="space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link href="/marketplace">
                <Button size="lg">Browse Events</Button>
              </Link>
              <Link href="/organizer/dashboard">
                <Button variant="outline" size="lg">
                  For Organizers
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <TrendingEvents />
      <HowItWorks />
    </main>
  )
}

