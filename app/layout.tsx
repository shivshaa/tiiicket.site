import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"
import { HeroCarousel } from "@/components/hero-carousel"
import { SiteFooter } from "@/components/site-footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WebIsGrey - NFT Ticketing Platform",
  description: "A decentralized ticketing platform powered by NFTs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <HeroCarousel />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
            <Toaster />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

