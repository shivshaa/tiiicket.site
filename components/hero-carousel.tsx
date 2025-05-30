"use client"

import { useEffect, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, EffectFade, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/effect-fade"
import "swiper/css/navigation"
import "swiper/css/pagination"

type CarouselMedia = {
  url: string
  alt: string
  caption: string
  type: "image" | "video" // Determines if media is an image or video
}

export function HeroCarousel() {
  const [mounted, setMounted] = useState(false)

  // Only show on homepage
  const isHomePage = typeof window !== "undefined" && window.location.pathname === "/"

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isHomePage) return null

  const carouselMedia: CarouselMedia[] = [
    {
      url: "https://res.cloudinary.com/deximageapi/image/upload/v1748328769/9303834_fbecua.jpg",
      alt: "Concert with crowd and stage lights",
      caption: "Experience Unforgettable Live Sports Events.",
      type: "image",
    },
    {
      url: "https://videos.pexels.com/video-files/2430839/2430839-uhd_2560_1440_24fps.mp4",
      alt: "Soccer stadium filled with fans",
      caption: "Hassle free tickets to Premier Sports Matches",
      type: "video",
    },
    {
      url: "https://videos.pexels.com/video-files/2324274/2324274-uhd_2560_1440_25fps.mp4",
      alt: "Concert with crowd and stage lights",
      caption: "Easy Buy and Sell on the Marketplace",
      type: "video",
    },
    {
      url: "https://videos.pexels.com/video-files/16651367/16651367-uhd_2560_1440_60fps.mp4",
      alt: "Basketball game in arena",
      caption: "Don't Miss the Biggest Sporting Events of the Year.",
      type: "video",
    },
    {
      url: "https://videos.pexels.com/video-files/14670415/14670415-hd_1920_1080_24fps.mp4",
      alt: "Crowd enjoying a music festival",
      caption: "100% Verified and Tamper-Proof Tickets",
      type: "video",
    },
    {
      url: "https://videos.pexels.com/video-files/30334109/13003291_1920_1080_30fps.mp4",
      alt: "Crowd",
      caption: "Finally!, A fair price, no scalpers involved.",
      type: "video",
    },
    {
    url: "https://res.cloudinary.com/deximageapi/image/upload/v1748328767/9303816_okrs82.jpg",
    alt: "ocean drone",
    caption: "No Refund Drama",
    type: "image",
    },
  ]

  return (
<Swiper
  modules={[Autoplay, EffectFade, Pagination]}
  effect="fade"
  autoplay={{
    delay: 5000,
    disableOnInteraction: false,
  }}
  pagination={{ clickable: true }}
  loop
  className="w-full h-screen relative overflow-hidden"
>
  {carouselMedia.map((media, index) => (
    <SwiperSlide key={index}>
      <div className="relative w-full h-screen">
        {media.type === "video" ? (
          <video
            src={media.url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={media.url}
            alt={media.alt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay with Caption */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white max-w-2xl px-4">
            <h2 className="text-5xl font-bold mb-4 animate-fade-in-up">{media.caption}</h2>
            <p className="text-xl top-600px animate-slide-in-left animate-duration-700">Powered by blockchain technology</p>
          </div>
        </div>
      </div>
    </SwiperSlide>
  ))}
</Swiper>

  )
}
