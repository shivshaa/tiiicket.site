import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, Phone, MapPin } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function SiteFooter() {
  return (
    <footer className="bg-muted/70 border-t">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/music" className="text-muted-foreground hover:text-primary transition-colors">
                  Music Events
                </Link>
              </li>
              <li>
                <Link href="/sports" className="text-muted-foreground hover:text-primary transition-colors">
                  Sports Events
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>

            {/* Blockchain Information */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Blockchain Information</h3>
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                  Powered by Polygon
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Network: Amoy Testnet</p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <span className="text-muted-foreground">support@webisgreytickets.com</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                <span className="text-muted-foreground">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span className="text-muted-foreground">123 Blockchain Avenue, New York, NY 10001</span>
              </li>
            </ul>

            {/* Newsletter Signup */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
              <div className="flex space-x-2">
                <Input type="email" placeholder="Your email" className="max-w-[220px]" />
                <Button variant="outline">Subscribe</Button>
              </div>
            </div>
          </div>

          {/* Social Media Links & Partner Logos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4 mb-8">
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Button>
              </Link>
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </Link>
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Button>
              </Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
            </div>

            <h3 className="text-lg font-semibold mb-4">Our Partners</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background rounded-md p-2 flex items-center justify-center">
                <img src="/placeholder.svg?height=40&width=80" alt="Partner 1" className="h-8" />
              </div>
              <div className="bg-background rounded-md p-2 flex items-center justify-center">
                <img src="/placeholder.svg?height=40&width=80" alt="Partner 2" className="h-8" />
              </div>
              <div className="bg-background rounded-md p-2 flex items-center justify-center">
                <img src="/placeholder.svg?height=40&width=80" alt="Partner 3" className="h-8" />
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="font-bold">WebIsGrey</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © 2025 WebIsGrey. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

