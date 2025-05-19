import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Instagram, Twitter, Facebook, Music, Ticket, Trophy, Store, ArrowRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function SiteFooter() {
  return (
    <footer className="bg-muted/10 border-t">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image 
                src="https://res.cloudinary.com/deximageapi/image/upload/v1744465886/Screenshot_2025-04-12_192046-removebg-preview_ebhg42.png"
                alt="tiiicket logo"
                width={24}
                height={24}
              />
              <span className="font-bold">tiiicket.com</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Modern blockchain ticketing for real fans.
              Powered by Polygon.
            </p>
            <div className="flex space-x-2">
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </Link>
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </Button>
              </Link>
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Facebook className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/music" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Music Events
                </Link>
              </li>
              <li>
                <Link href="/sports" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Sports Events
                </Link>
              </li>
              <li>
                <Link href="/market" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/organizer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  For Organizers
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our mailing list for exclusive event drops and offers.
            </p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Email address" className="h-9" />
              <Button size="sm" className="h-9">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/contact" className="text-xs text-muted-foreground hover:text-primary">
              Contact
            </Link>
            <span className="text-xs text-muted-foreground">
              <Mail className="h-3 w-3 inline mr-1" />
              support@tiiicket.com
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © 2025 tiiicket.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
