"use client"

import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Heart,
  CreditCard,
  Megaphone,
  Calendar,
  Settings,
  Wallet,
} from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("")
  const [, startTransition] = useTransition()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "donations", label: "Donations", icon: Heart },
    { id: "expenses", label: "Expenses", icon: CreditCard },
    { id: "reports", label: "Reports", icon: Megaphone },
    { id: "withdrawal", label: "Withdrawal", icon: Wallet },
    { id: "temple-info", label: "Temple Info", icon: Settings },
  ]

  const handleSectionChange = (sectionId: string) => {
    startTransition(() => {
      router.push(`/templeadmin/${sectionId}`)
      setActiveSection(sectionId)
    })
  }

  useEffect(() => {
    const section = pathname.split("/")[2] // Extract section from path
    if (section) setActiveSection(section)
  }, [pathname])

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-white shadow-xl border-r border-orange-100 h-full"
    >
      <nav className="p-4 space-y-2 h-full">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </nav>
    </motion.div>
  )
}
