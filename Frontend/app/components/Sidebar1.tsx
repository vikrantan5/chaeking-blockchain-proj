"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  UserPlus, 
  CheckCircle, 
  Building2 
} from 'lucide-react';
import { useEffect, useState, useTransition } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('');
  const [isPending, startTransition] = useTransition();

  const [loadingDots, setLoadingDots] = useState('');

useEffect(() => {
  if (!isPending) {
    setLoadingDots('');
    return;
  }

  const interval = setInterval(() => {
    setLoadingDots(prev => {
      if (prev === '...') return '.';
      return prev + '.';
    });
  }, 300);

  return () => clearInterval(interval);
}, [isPending]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'register-temple', label: 'Register', icon: UserPlus },
    { id: 'confirm-temple', label: 'Confirm', icon: CheckCircle },
    { id: 'temple-list', label: 'All Registered Temples', icon: Building2 }
  ];

  const handleSectionChange = (sectionId: string) => {
    startTransition(() => {
      router.push(`/superadmin/${sectionId}`);
      setActiveSection(sectionId); // set after route transition
    });
  };

  useEffect(() => {
    const section = pathname.split('/')[2]; // get the third part of the path
    if (section) {
      setActiveSection(section);
    }
  }, [pathname]);

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">SuperAdmin Panel</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  disabled={isPending} // optional: disable during loading
                >
                  <Icon className="w-5 h-5" />
                  <span>
                    {item.label} {isPending && isActive && loadingDots}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
