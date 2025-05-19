"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
  aspectRatio?: number
}

export function LazyImage({
  src,
  alt,
  className,
  fallback = "/placeholder.svg?height=400&width=600",
  aspectRatio = 16 / 9,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallback)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!src) return

    const img = new Image()
    img.src = src
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
    }
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`)
      setImageSrc(fallback)
      setIsLoaded(true)
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, fallback])

  return (
    <div
      className={cn("overflow-hidden relative", !isLoaded && "bg-muted animate-pulse", className)}
      style={{ aspectRatio }}
    >
      <img
        src={imageSrc || "/placeholder.svg"}
        alt={alt || ""}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        {...props}
      />
    </div>
  )
}
