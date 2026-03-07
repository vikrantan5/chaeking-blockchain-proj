"use client";

import { useEffect } from "react";
import { refreshAccessToken } from "@/app/utils/refreshAccessToken";

const AuthWrapper = ({ children, role }: { children: React.ReactNode; role: "superAdmin" | "templeAdmin" | "user" }) => {
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const endpoint =
                    role === "superAdmin"
                        ? "http://localhost:5050/api/v1/superAdmin/refresh-Access-Token"
                        : role === "templeAdmin"
                        ? "http://localhost:5050/api/v1/templeAdmin/refresh-token"
                        : "http://localhost:5050/api/v1/users/refresh-Token";
                await refreshAccessToken(endpoint);
            } catch (error) {
                console.error("Failed to refresh access token:", error);
            }
        }, 15 * 60 * 1000); // 15 minutes for testing

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [role]);

    return <>{children}</>;
};

export default AuthWrapper;