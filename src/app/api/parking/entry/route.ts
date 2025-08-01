import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getDayPassAmount } from "@/lib/pricing";

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

        const { numberPlate, vehicleType, billingType, slotId } =
            await request.json();

        if (!numberPlate || !vehicleType || !billingType) {
            return NextResponse.json(
                {
                    error: "Number plate, vehicle type, and billing type are required",
                },
                { status: 400 }
            );
        }

        // Check if vehicle already has an active session
        const existingSession = await prisma.parkingSession.findFirst({
            where: {
                vehicleNumberPlate: numberPlate,
                status: "Active",
            },
        });

        if (existingSession) {
            return NextResponse.json(
                { error: "Vehicle already has an active parking session" },
                { status: 400 }
            );
        }

        let assignedSlotId = slotId;

        // Auto-assign slot if not provided
        if (!assignedSlotId) {
            const availableSlot = await prisma.parkingSlot.findFirst({
                where: {
                    status: "Available",
                    slotType:
                        vehicleType === "Car"
                            ? { in: ["Regular", "Compact"] }
                            : vehicleType === "Bike"
                            ? "Compact"
                            : vehicleType === "EV"
                            ? "EV"
                            : "Handicap",
                },
            });

            if (!availableSlot) {
                return NextResponse.json(
                    { error: "No available slots for this vehicle type" },
                    { status: 400 }
                );
            }

            assignedSlotId = availableSlot.id;
        }

        // Verify slot is available
        const slot = await prisma.parkingSlot.findUnique({
            where: { id: assignedSlotId },
        });

        if (!slot || slot.status !== "Available") {
            return NextResponse.json(
                { error: "Selected slot is not available" },
                { status: 400 }
            );
        }

        // Create or update vehicle
        await prisma.vehicle.upsert({
            where: { numberPlate },
            update: { vehicleType },
            create: {
                numberPlate,
                vehicleType,
            },
        });

        // Create parking session
        const session = await prisma.parkingSession.create({
            data: {
                vehicleNumberPlate: numberPlate,
                slotId: assignedSlotId,
                billingType,
                billingAmount:
                    billingType === "DayPass" ? getDayPassAmount() : null,
            },
            include: {
                vehicle: true,
                slot: true,
            },
        });

        // Update slot status
        await prisma.parkingSlot.update({
            where: { id: assignedSlotId },
            data: { status: "Occupied" },
        });

        return NextResponse.json({
            message: "Vehicle entry recorded successfully",
            session,
        });
    } catch (error) {
        console.error("Entry error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
