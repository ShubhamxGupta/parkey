import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        // Get slot statistics
        const totalSlots = await prisma.parkingSlot.count();
        const availableSlots = await prisma.parkingSlot.count({
            where: { status: "Available" },
        });
        const occupiedSlots = await prisma.parkingSlot.count({
            where: { status: "Occupied" },
        });
        const maintenanceSlots = await prisma.parkingSlot.count({
            where: { status: "Maintenance" },
        });

        // Get slots by type
        const slotsByType = await prisma.parkingSlot.groupBy({
            by: ["slotType", "status"],
            _count: true,
        });

        // Get active sessions
        const activeSessions = await prisma.parkingSession.count({
            where: { status: "Active" },
        });

        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySessions = await prisma.parkingSession.findMany({
            where: {
                status: "Completed",
                exitTime: {
                    gte: today,
                },
            },
        });

        const todayRevenue = todaySessions.reduce((sum, session) => {
            return sum + (session.billingAmount || 0);
        }, 0);

        // Get hourly vs day pass revenue
        const hourlyRevenue = todaySessions
            .filter((s) => s.billingType === "Hourly")
            .reduce((sum, session) => sum + (session.billingAmount || 0), 0);

        const dayPassRevenue = todaySessions
            .filter((s) => s.billingType === "DayPass")
            .reduce((sum, session) => sum + (session.billingAmount || 0), 0);

        return NextResponse.json({
            stats: {
                totalSlots,
                availableSlots,
                occupiedSlots,
                maintenanceSlots,
                activeSessions,
            },
            revenue: {
                today: todayRevenue,
                hourly: hourlyRevenue,
                dayPass: dayPassRevenue,
            },
            slotsByType,
        });
    } catch (error) {
        console.error("Stats error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
