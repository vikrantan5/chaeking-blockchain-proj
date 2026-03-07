import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtDecode } from "jwt-decode"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // Get the pathname of the request
    const path = request.nextUrl.pathname

    // Check if the path is public (login page)
    const isPublicPath =
        path === "/superadminlogin" ||
        path === "/templelogin" ||
        path === "/login";

    // Get the token from cookies
    const accessToken = request.cookies.get("accessToken")?.value

    let isAuthenticated = false

    // Verify token if it exists
    if (accessToken) {
        try {
            const decoded: any = jwtDecode(accessToken)
            const currentTime = Math.floor(Date.now() / 1000)

            // Check if token is not expired
            if (decoded.exp && decoded.exp > currentTime) {
                isAuthenticated = true
            } else {
                // Clear expired token
                const response = handleExpiredTokenRedirect(path, request);
                response.cookies.delete("accessToken")
                response.cookies.delete("refreshToken")
                return response
            }
        } catch (error) {
            console.error("Middleware - Token verification failed:", error);
            // Clear invalid token
            const response = handleExpiredTokenRedirect(path, request);
            response.cookies.delete("accessToken")
            response.cookies.delete("refreshToken")
            return response
        }
    }

    // If user is authenticated and trying to access login page, redirect to dashboard
    if (isPublicPath && isAuthenticated) {
        if (path === "/superadminlogin") {
            return NextResponse.redirect(
                new URL("/superadmin/dashboard", request.url)
            );
        } else if (path === "/templelogin") {
            return NextResponse.redirect(
                new URL("/templeadmin/dashboard", request.url)
            );
        } else if (path === '/login') {
            return NextResponse.redirect(
                new URL("/user/dashboard", request.url
                )
            );
        }
    }

    // If the path is dashboard or any of its subpaths and user is not authenticated,
    // redirect to login
    if (path.startsWith("/superadmin") && !isAuthenticated) {
        const response = NextResponse.redirect(
            new URL("/superadminlogin", request.url)
        )
        // Clear any existing tokens
        response.cookies.delete("accessToken")
        response.cookies.delete("refreshToken")
        return response
    }

    // If the path is templeadmin/dashboard or its subpaths and user is not authenticated, redirect to templeadmin login
    if (path.startsWith("/templeadmin") && !isAuthenticated) {
        const response = NextResponse.redirect(
            new URL("/templelogin", request.url)
        );
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
    }

    // Restrict access to /user/... routes 
    if (path.startsWith("/user") && !isAuthenticated) {
        const response = NextResponse.redirect(
            new URL("/login", request.url)
        );
        response.cookies.delete("accessToken")
        response.cookies.delete("refreshToken")
        return response;
    }

    return NextResponse.next()
}

// Helper function to handle redirection based on the path
function handleExpiredTokenRedirect(path: string, request: NextRequest) {
    if (path.startsWith("/superadmin")) {
        return NextResponse.redirect(new URL("/superadminlogin", request.url));
    } else if (path.startsWith("/templeadmin")) {
        return NextResponse.redirect(new URL("/templelogin", request.url));
    } else if (path.startsWith("/user")) {
        return NextResponse.redirect(new URL("/login", request.url));
    } else {
        return NextResponse.redirect(new URL("/", request.url));
    }
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        "/",
        "/superadmin/:path*",
        "/templeadmin/:path*",
        "/user/:path*",
    ]
}
