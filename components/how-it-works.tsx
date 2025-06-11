"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, TrendingUp, CreditCard, Calendar, RefreshCw, ShoppingCart } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: "Register",
      description: "Create your account in seconds and join our community of event enthusiasts.",
      color: "from-violet-500 to-purple-600",
      step: "01"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Browse Events",
      description: "Discover trending events, concerts, and experiences tailored to your interests.",
      color: "from-blue-500 to-cyan-600",
      step: "02"
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Purchase Tickets",
      description: "Secure your spot with our fast, safe, and transparent ticketing system.",
      color: "from-emerald-500 to-teal-600",
      step: "03"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Attend Event",
      description: "Show up and enjoy unforgettable moments with seamless digital entry.",
      color: "from-orange-500 to-red-600",
      step: "04"
    },
    {
      icon: <RefreshCw className="h-8 w-8" />,
      title: "Can't Make It?",
      description: "Life happens. No worries - we've got you covered with flexible options.",
      color: "from-pink-500 to-rose-600",
      step: "05"
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Resale Marketplace",
      description: "List your tickets on our secure marketplace and help another fan attend.",
      color: "from-indigo-500 to-purple-600",
      step: "06"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }

  return (
    <section className="relative min-h-screen py-20 bg-slate-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-violet-500/5 via-transparent to-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 backdrop-blur-sm border border-violet-500/30 rounded-full text-sm font-medium text-white">
              Simple Process
            </span>
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-6">
            How It Works
          </h2>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From registration to resale, we've streamlined every step of your event journey
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="group"
            >
              <Card className="relative h-full bg-slate-900/50 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-500 overflow-hidden">
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-lg`}></div>
                
                <CardContent className="relative p-8">
                  {/* Step Number */}
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-6xl font-bold text-slate-700/50 group-hover:text-slate-600/70 transition-colors duration-500">
                      {step.step}
                    </span>
                    <motion.div 
                      className={`p-4 rounded-2xl bg-gradient-to-r ${step.color} shadow-lg`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    >
                      <div className="text-white">
                        {step.icon}
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-gray-100 transition-colors duration-300">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Decorative Element */}
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.button
            className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Get Started Today</span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-cyan-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
