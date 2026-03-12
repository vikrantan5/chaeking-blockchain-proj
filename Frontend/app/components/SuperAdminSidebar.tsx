"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Package,
  Heart,
  CheckSquare,
  List,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("");
  const [, startTransition] = useTransition();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/superadmin/dashboard" },
    { id: "ngo-list", label: "Pending NGOs", icon: CheckSquare, path: "/superadmin/ngo-list" },
    { id: "temple-list", label: "All NGOs", icon: Building2, path: "/superadmin/temple-list" },
    { id: "products", label: "Products", icon: Package, path: "/superadmin/products" },
    { id: "register-temple", label: "Cases", icon: Heart, path: "/superadmin/register-temple" },
  ];

  const handleSectionChange = (path: string, sectionId: string) => {
    startTransition(() => {
      router.push(path);
      setActiveSection(sectionId);
    });
  };

  useEffect(() => {
    // Extract section from pathname
    const pathParts = pathname.split("/");
    const section = pathParts[2] || "dashboard";
    setActiveSection(section);
  }, [pathname]);

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-white shadow-xl border-r border-blue-100 h-full"
      data-testid="superadmin-sidebar"
    >
      <div className="p-6 border-b border-blue-100">
        <h2 className="text-xl font-bold text-blue-600">Super Admin</h2>
        <p className="text-sm text-gray-500">Control Panel</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleSectionChange(item.path, item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`superadmin-sidebar-${item.id}`}
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
          );
        })}
      </nav>
    </motion.div>
  );
}
