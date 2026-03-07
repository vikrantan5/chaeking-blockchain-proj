"use client";

import { useEffect } from 'react';
import React from 'react';
import AuthWrapper from '@/app/components/AuthWrapper';
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Eye
} from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5050")

export default function SuperAdminDashboard() {
  const [userCount, setUserCount] = React.useState(0);
  const [verifiedTempleCount, setVerifiedTempleCount] = React.useState(0);
  const [pendingTempleCount, setPendingTempleCount] = React.useState(0);

  // Fetch user count from the backend
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const userResponse = await fetch("http://localhost:5050/api/v1/superAdminDashboard/count-users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const userResult = await userResponse.json();

        if (userResponse.ok) {
          setUserCount(userResult.data.userCount);
        } else {
          console.error("Failed to fetch user count:", userResult.message);
        }

        const templeResponse = await fetch("http://localhost:5050/api/v1/superAdminDashboard/count-temple-admins", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const templeResult = await templeResponse.json();
        if (templeResponse.ok) {
          setVerifiedTempleCount(templeResult.data.verifiedCount);
          setPendingTempleCount(templeResult.data.pendingCount);
        } else {
          console.error("Error fetching temple admin counts:", templeResult.message);
        }

      } catch (error) {
        console.error("Error fetching user count:", error);
      }
    };

    fetchUserCount();
    // Listen for WebSocket updates
    socket.on("dashboard-updates", (data) => {
      if (data.userCount !== undefined) {
        setUserCount(data.userCount);
      }
      if (data.verifiedTempleCount !== undefined) {
        setVerifiedTempleCount(data.verifiedTempleCount);
      }
      if (data.pendingTempleCount !== undefined) {
        setPendingTempleCount(data.pendingTempleCount);
      }
    });
    
    return () => {
      console.log("Cleaning up WebSocket listners");
      socket.off("dashboard-updates");
    };

    }, []);

    return (
      <AuthWrapper role="superAdmin">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                  <p className="text-3xl font-bold">{userCount}</p>
                </div>
                <Users className="w-10 h-10 opacity-80" />
              </div>
            </div>

            {/* Total Temples */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Temples</h3>
                  <p className="text-3xl font-bold">{verifiedTempleCount}</p>
                </div>
                <Building2 className="w-10 h-10 opacity-80" />
              </div>
            </div>

            {/* Pending Temples */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
                  <p className="text-3xl font-bold">{pendingTempleCount}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </div>

            {/* Active Connections */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Active Connections</h3>
                  <p className="text-3xl font-bold">18</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Withdrawals</h3>
                  <p className="text-3xl font-bold">₹8.7L</p>
                </div>
                <TrendingDown className="w-10 h-10 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Visitor Count</h3>
                  <p className="text-3xl font-bold">2,847</p>
                </div>
                <Eye className="w-10 h-10 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Donations</h3>
                  <p className="text-3xl font-bold">₹15.2L</p>
                </div>
                <DollarSign className="w-10 h-10 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </AuthWrapper>
    );
  };