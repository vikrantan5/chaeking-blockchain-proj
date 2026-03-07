"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import AuthWrapper from "@/app/components/AuthWrapper";

export default function TempleAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <AuthWrapper role="templeAdmin">
        {/* Navbar on top full width */}
        <Navbar />

        {/* Sidebar + main content */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <main className="p-8">{children}</main>
          </div>
        </div>
      </AuthWrapper>
    </div>
  );
}
