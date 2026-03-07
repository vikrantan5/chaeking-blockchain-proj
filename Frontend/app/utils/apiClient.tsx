import { refreshAccessToken } from "./refreshAccessToken";

export const apiClient = async (url: string, options: RequestInit = {}, role: "superAdmin" | "templeAdmin") => {
    try {
        let accessToken = sessionStorage.getItem("accessToken");

        // Add the access token to the headers
        const headers = {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        };

        let response = await fetch(url, { ...options, headers });

        // If the access token is expired or missing, refresh it
        if (response.status === 401) {
            console.warn("Access token expired or missing. Refreshing...");

            // Determine the refresh endpoint based on the role
            const refreshEndpoint =
                role === "superAdmin"
                    ? "http://localhost:5050/api/v1/superAdmin/refresh-Access-Token"
                    : role === "templeAdmin"
                    ? "http://localhost:5050/api/v1/templeAdmin/refresh-token"
                    : "http://localhost:5050/api/v1/users/refresh-Token";

            accessToken = await refreshAccessToken(refreshEndpoint);

            // Retry the original request with the new access token
            const retryHeaders = {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
            };

            response = await fetch(url, { ...options, headers: retryHeaders });
        }

        return response;
    } catch (error) {
        console.error("API request error:", error);
        throw error;
    }
};