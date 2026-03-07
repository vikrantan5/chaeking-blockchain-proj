"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import React from "react";

interface LogoutButtonProps {
  logoutUrl: string;
  redirectTo: string;
  children?: React.ReactNode;
  onLogoutClick?: () => void;
}

export default function LogoutButton({
  logoutUrl,
  redirectTo,
  children,
  onLogoutClick,
}: LogoutButtonProps) {
  const router = useRouter();

  const confirmLogout = () => {
    onLogoutClick?.(); // Close dropdown immediately

    const toastId = toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-2">Are you sure you want to logout?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                closeToast && closeToast();
              }}
              className="px-3 py-1 rounded bg-gray-300 text-black text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                closeToast && closeToast();
                await handleLogout();
              }}
              className="px-3 py-1 rounded bg-red-600 text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        closeOnClick: false,
        closeButton: false,
        autoClose: false,
        draggable: false,
        pauseOnHover: false,
      }
    );
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(logoutUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();

        if (!response.ok) {
          toast.error(result.message || "Logout failed");
          return;
        }

        sessionStorage.clear();
        localStorage.clear();
        toast.success("Logged out successfully");
        setTimeout(() => {
          router.push(redirectTo);
        }, 1500);
      } else {
        const text = await response.text();
        console.error("Unexpected response format:", text);
        toast.error("Unexpected server response");
      }
    } catch (error: any) {
      toast.error(error.message || "Logout failed");
    }
  };

  return (
    <button onClick={confirmLogout}>
      {children ? children : "Logout"}
    </button>
  );
}