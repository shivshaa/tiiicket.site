"use client"

import { HeroCarousel } from "@/components/hero-carousel"
import { FeaturedEvents } from "@/components/featured-events"
import { HowItWorks } from "@/components/how-it-works"
import { TrendingEvents } from "@/components/trending-events"
import { OldEvents } from "@/components/old-events"

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <TrendingEvents />
      <OldEvents />
      <HowItWorks />
    </>
  )
}
