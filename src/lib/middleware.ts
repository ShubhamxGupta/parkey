import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./auth";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const isAuthPage = request.nextUrl.pathname === "/";
    const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

    // If user is on auth page but has valid token, redirect to dashboard
    if (isAuthPage && token) {
        const decoded = verifyToken(token);
        if (decoded) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    // If user is on dashboard but has no valid token, redirect to login
    if (isDashboardPage && (!token || !verifyToken(token))) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
