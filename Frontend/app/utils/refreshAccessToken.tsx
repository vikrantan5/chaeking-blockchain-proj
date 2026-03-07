export const refreshAccessToken = async (endpoint) => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
        throw new Error("Refresh token is missing");
    }

    //  console.log("Using refreshToken:", refreshToken); // Debugging

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include", // Include cookies in the request
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error("Failed to refresh access token");
        }

        const result = await response.json();
        // console.log("Refresh token response:", result); // Debugging

        if (result.success) {
            // Store the new access token and refresh token
            sessionStorage.setItem("accessToken", result.data.accessToken);
            localStorage.setItem("refreshToken", result.data.refreshToken);
            return result.data.accessToken;
        } else {
            throw new Error(result.message || "Failed to refresh access token");
        }
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw error;
    }
};