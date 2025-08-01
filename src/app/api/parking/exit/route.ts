import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { calculateHourlyBilling, isOverstay } from "@/lib/pricing";

export async function POST(request: NextRequest) {
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

        const { numberPlate } = await request.json();

        if (!numberPlate) {
            return NextResponse.json(
                { error: "Number plate is required" },
                { status: 400 }
            );
        }

        // Find active session
        const session = await prisma.parkingSession.findFirst({
            where: {
                vehicleNumberPlate: numberPlate,
                status: "Active",
            },
            include: {
                vehicle: true,
                slot: true,
            },
        });

        if (!session) {
            return NextResponse.json(
                { error: "No active parking session found for this vehicle" },
                { status: 404 }
            );
        }

        const exitTime = new Date();
        let billingAmount = session.billingAmount;

        // Calculate billing for hourly sessions
        if (session.billingType === "Hourly") {
            billingAmount = calculateHourlyBilling(session.entryTime, exitTime);
        }

        // Update session
        const updatedSession = await prisma.parkingSession.update({
            where: { id: session.id },
            data: {
                exitTime,
                status: "Completed",
                billingAmount,
            },
            include: {
                vehicle: true,
                slot: true,
            },
        });

        // Free the slot
        await prisma.parkingSlot.update({
            where: { id: session.slotId },
            data: { status: "Available" },
        });

        const overstay = isOverstay(session.entryTime, exitTime);

        return NextResponse.json({
            message: "Vehicle exit processed successfully",
            session: updatedSession,
            overstay,
            receipt: {
                vehicleNumber: session.vehicleNumberPlate,
                vehicleType: session.vehicle.type,
                slotNumber: session.slot.slotNumber,
                entryTime: session.entryTime,
                exitTime: exitTime,
                duration: Math.ceil(
                    (exitTime.getTime() - session.entryTime.getTime()) /
                        (1000 * 60 * 60)
                ),
                billingType: session.billingType,
                amount: billingAmount,
                overstay,
            },
        });
    } catch (error) {
        console.error("Exit error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
