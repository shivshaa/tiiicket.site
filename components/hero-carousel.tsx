"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

type CarouselMedia = {
  url: string;
  alt: string;
  caption: string;
  type: "image" | "video"; // Determines if media is an image or video
};

export function HeroCarousel() {
  const [mounted, setMounted] = useState(false);

  // Only show on homepage
  const isHomePage = typeof window !== "undefined" && window.location.pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isHomePage) return null;

  const carouselMedia: CarouselMedia[] = [
    {
      url: "https://images.unsplash.com/photo-1505842465776-3b4953ca4f44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      alt: "Concert with crowd and stage lights",
      caption: "Experience Unforgettable Live Music Events",
      type: "image",
    },
    {
      url: "https://videos.pexels.com/video-files/16726088/16726088-uhd_1440_2560_60fps.mp4",
      alt: "Soccer stadium filled with fans",
      caption: "Get Your Tickets for Premier Sports Matches",
      type: "video",
    },
    {
      url: "https://videos.pexels.com/video-files/16651367/16651367-uhd_2560_1440_60fps.mp4",
      alt: "Basketball game in arena",
      caption: "Don't Miss the Biggest Sporting Events of the Year",
      type: "video",
    },
    {
      url: "https://videos.pexels.com/video-files/14670415/14670415-hd_1920_1080_24fps.mp4",
      alt: "Crowd enjoying a music festival",
      caption: "Secure Your Tickets to the Hottest Music Festivals",
      type: "video",
    },
  ];

  return (
    <Swiper
      modules={[Autoplay, EffectFade, Navigation, Pagination]}
      effect="fade"
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
      navigation
      pagination={{ clickable: true }}
      loop
      className="w-full h-[600px] relative"
    >
      {carouselMedia.map((media, index) => (
        <SwiperSlide key={index}>
          <div className="relative w-full h-full">
            {/* Conditional Rendering for Video or Image */}
            {media.type === "video" ? (
              <video
                src={media.url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={media.url}
                alt={media.alt}
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay with Caption */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white max-w-2xl px-4">
                {/* Caption with Fade-In Animation */}
                <h2 className="text-5xl font-bold mb-4 animate-fade-in-up">
                  {media.caption}
                </h2>

                {/* Subtext with Delayed Animation */}
                <p className="text-xl animate-slide-in-left animate-duration-700">
                  Powered by blockchain technology
                </p>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

