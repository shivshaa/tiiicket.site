"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

interface ParallaxElementsProps {
  className?: string
}

export function ParallaxElements({ className }: ParallaxElementsProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -600])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -300])
  const y5 = useTransform(scrollYProgress, [0, 1], [0, -500])

  const opacity1 = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1, 0.3])
  const opacity2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 0.8, 0.2])

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute top-[10%] left-[10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl"
        style={{ y: y1, opacity: opacity1 }}
      />
      <motion.div
        className="absolute top-[30%] right-[15%] w-80 h-80 rounded-full bg-purple-400/10 blur-3xl"
        style={{ y: y2, opacity: opacity2 }}
      />
      <motion.div
        className="absolute top-[60%] left-[20%] w-72 h-72 rounded-full bg-blue-400/10 blur-3xl"
        style={{ y: y3, opacity: opacity1 }}
      />
      <motion.div
        className="absolute top-[80%] right-[25%] w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        style={{ y: y4, opacity: opacity2 }}
      />
      <motion.div
        className="absolute top-[40%] left-[40%] w-48 h-48 rounded-full bg-purple-300/10 blur-3xl"
        style={{ y: y5, opacity: opacity1 }}
      />
    </div>
  )
}
