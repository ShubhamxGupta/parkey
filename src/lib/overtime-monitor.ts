import { parseISTTimeString, getCurrentISTTime } from "./time-utils";

export interface OvertimeVehicle {
    slotId: string;
    slotNumber: string;
    vehicleNumberPlate: string;
    vehicleType: string;
    entryTime: string;
    hoursParked: number;
    overtimeHours: number;
    billingType: string;
}

export function isOvertimeVehicle(session: any): boolean {
    let entryTime: Date;

    try {
        // Try to parse as IST time string first
        if (session.entryTime.includes("/")) {
            entryTime = parseISTTimeString(session.entryTime);
        } else {
            entryTime = new Date(session.entryTime);
        }
    } catch (error) {
        entryTime = new Date(session.entryTime);
    }

    const now = getCurrentISTTime();

    if (session.billingType === "Hourly") {
        const hoursParked =
            (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
        return hoursParked > 6;
    }

    if (session.billingType === "DayPass") {
        const entryDate = entryTime.getDate();
        const entryMonth = entryTime.getMonth();
        const entryYear = entryTime.getFullYear();
        const nowDate = now.getDate();
        const nowMonth = now.getMonth();
        const nowYear = now.getFullYear();

        return (
            now.getHours() >= 0 &&
            now.getHours() < 6 &&
            (entryDate !== nowDate ||
                entryMonth !== nowMonth ||
                entryYear !== nowYear)
        );
    }

    return false;
}

export function getOvertimeVehicles(slots: any[]): OvertimeVehicle[] {
    return slots
        .filter((slot) => slot.status === "Occupied" && slot.parkingSessions[0])
        .filter((slot) => isOvertimeVehicle(slot.parkingSessions[0]))
        .map((slot) => {
            const session = slot.parkingSessions[0];
            let entryTime: Date;

            try {
                if (session.entryTime.includes("/")) {
                    entryTime = parseISTTimeString(session.entryTime);
                } else {
                    entryTime = new Date(session.entryTime);
                }
            } catch (error) {
                entryTime = new Date(session.entryTime);
            }

            const now = getCurrentISTTime();
            const hoursParked =
                (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
            const overtimeHours = Math.max(0, hoursParked - 6);

            return {
                slotId: slot.id,
                slotNumber: slot.slotNumber,
                vehicleNumberPlate: session.vehicle.numberPlate,
                vehicleType: session.vehicle.type,
                entryTime: session.entryTime,
                hoursParked,
                overtimeHours,
                billingType: session.billingType,
            };
        });
}

export function showOvertimePopup(vehicle: OvertimeVehicle) {
    // Create popup element
    const popup = document.createElement("div");
    popup.className =
        "fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300";
    popup.style.animation = "slideInRight 0.3s ease-out";

    popup.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <div class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                </div>
            </div>
            <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-red-800">Overtime Alert</h3>
                <div class="mt-2 text-sm text-red-700">
                    <p><strong>Vehicle:</strong> ${
                        vehicle.vehicleNumberPlate
                    }</p>
                    <p><strong>Slot:</strong> ${vehicle.slotNumber}</p>
                    <p><strong>Hours Parked:</strong> ${vehicle.hoursParked.toFixed(
                        1
                    )}h</p>
                    <p><strong>Overtime:</strong> ${vehicle.overtimeHours.toFixed(
                        1
                    )}h</p>
                    <p><strong>Type:</strong> ${vehicle.billingType}</p>
                </div>
                <div class="mt-3 flex space-x-2">
                    <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = "slideOutRight 0.3s ease-in";
            setTimeout(() => popup.remove(), 300);
        }
    }, 10000);
}

export function showOvertimeNotification(vehicles: OvertimeVehicle[]) {
    if (vehicles.length === 0) return;

    // Show individual popups for each vehicle
    vehicles.forEach((vehicle, index) => {
        setTimeout(() => {
            showOvertimePopup(vehicle);
        }, index * 500); // Stagger popups by 500ms
    });
}

// Add CSS animations
export function addOvertimeStyles() {
    if (!document.getElementById("overtime-styles")) {
        const style = document.createElement("style");
        style.id = "overtime-styles";
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
